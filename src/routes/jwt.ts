import { createHmac, timingSafeEqual } from "node:crypto";
import type { FastifyInstance } from "fastify";

interface JwtBody {
  token: string;
  secret?: string;
}

const HMAC_ALG: Record<string, string> = { HS256: "sha256", HS384: "sha384", HS512: "sha512" };

function decodeSegment(seg: string): unknown {
  return JSON.parse(Buffer.from(seg, "base64url").toString("utf8"));
}

export async function jwtRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: { payload: Record<string, unknown>; secret: string; algorithm?: "HS256" | "HS384" | "HS512"; expiresIn?: number } }>(
    "/v1/jwt/sign",
    {
      schema: {
        summary: "Sign a JWT (HS256/384/512)",
        description: "Creates an HMAC-signed JWT from your payload and secret. Set expiresIn (seconds) to add iat/exp claims.",
        tags: ["crypto"],
        body: {
          type: "object",
          required: ["payload", "secret"],
          properties: {
            payload: { type: "object", additionalProperties: true },
            secret: { type: "string", maxLength: 1024 },
            algorithm: { type: "string", enum: ["HS256", "HS384", "HS512"], default: "HS256" },
            expiresIn: { type: "integer", minimum: 1, maximum: 315360000 },
          },
        },
      },
    },
    async (req) => {
      const { payload, secret, algorithm = "HS256", expiresIn } = req.body;
      const alg = HMAC_ALG[algorithm];
      const header = { alg: algorithm, typ: "JWT" };
      const now = Math.floor(Date.now() / 1000);
      const claims = expiresIn ? { iat: now, exp: now + expiresIn, ...payload } : payload;
      const enc = (o: unknown): string => Buffer.from(JSON.stringify(o)).toString("base64url");
      const signingInput = `${enc(header)}.${enc(claims)}`;
      const signature = createHmac(alg, secret).update(signingInput).digest("base64url");
      return { token: `${signingInput}.${signature}` };
    },
  );

  app.post<{ Body: JwtBody }>(
    "/v1/jwt/decode",
    {
      schema: {
        summary: "Decode (and optionally verify) a JWT",
        description:
          "Decodes header and payload without trusting the signature. If `secret` is provided and the algorithm is HS256/384/512, the HMAC signature is verified. Never sends your secret anywhere.",
        tags: ["crypto"],
        body: {
          type: "object",
          required: ["token"],
          properties: {
            token: { type: "string", maxLength: 8192 },
            secret: { type: "string", maxLength: 1024 },
          },
        },
      },
    },
    async (req, reply) => {
      const parts = req.body.token.split(".");
      if (parts.length !== 3) {
        return reply.code(422).send({ error: "invalid_jwt", message: "Expected a token with three dot-separated segments." });
      }
      let header: Record<string, unknown>, payload: Record<string, unknown>;
      try {
        header = decodeSegment(parts[0]) as Record<string, unknown>;
        payload = decodeSegment(parts[1]) as Record<string, unknown>;
      } catch {
        return reply.code(422).send({ error: "invalid_jwt", message: "Header/payload is not valid base64url JSON." });
      }

      const now = Math.floor(Date.now() / 1000);
      const exp = typeof payload.exp === "number" ? payload.exp : null;
      const nbf = typeof payload.nbf === "number" ? payload.nbf : null;

      let signatureValid: boolean | null = null;
      if (req.body.secret) {
        const alg = HMAC_ALG[String(header.alg)];
        if (!alg) {
          signatureValid = null;
        } else {
          const expected = createHmac(alg, req.body.secret)
            .update(`${parts[0]}.${parts[1]}`)
            .digest("base64url");
          const a = Buffer.from(expected);
          const b = Buffer.from(parts[2]);
          signatureValid = a.length === b.length && timingSafeEqual(a, b);
        }
      }

      return {
        header,
        payload,
        expired: exp === null ? null : now >= exp,
        notYetValid: nbf === null ? null : now < nbf,
        signatureValid,
      };
    },
  );
}
