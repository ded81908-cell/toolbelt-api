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
