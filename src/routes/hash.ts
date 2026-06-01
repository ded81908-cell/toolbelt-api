import { createHash, createHmac, randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";

interface HashBody {
  input: string;
  algorithm?: "md5" | "sha1" | "sha256" | "sha512";
  hmacKey?: string;
}

interface EncodeBody {
  input: string;
  operation: "base64-encode" | "base64-decode" | "url-encode" | "url-decode" | "hex-encode" | "hex-decode";
}

const hashSchema = {
  summary: "Hash a string (optionally HMAC)",
  description: "Computes MD5/SHA1/SHA256/SHA512, plus optional HMAC when a key is supplied. No AI cost.",
  tags: ["crypto"],
  body: {
    type: "object",
    required: ["input"],
    properties: {
      input: { type: "string", maxLength: 1_000_000 },
      algorithm: { type: "string", enum: ["md5", "sha1", "sha256", "sha512"], default: "sha256" },
      hmacKey: { type: "string", maxLength: 4096 },
    },
  },
};

const encodeSchema = {
  summary: "Encode or decode a string",
  description: "Base64, URL and hex encode/decode. No AI cost.",
  tags: ["crypto"],
  body: {
    type: "object",
    required: ["input", "operation"],
    properties: {
      input: { type: "string", maxLength: 1_000_000 },
      operation: {
        type: "string",
        enum: ["base64-encode", "base64-decode", "url-encode", "url-decode", "hex-encode", "hex-decode"],
      },
    },
  },
};

function encode(input: string, operation: EncodeBody["operation"]): string {
  switch (operation) {
    case "base64-encode":
      return Buffer.from(input, "utf8").toString("base64");
    case "base64-decode":
      return Buffer.from(input, "base64").toString("utf8");
    case "url-encode":
      return encodeURIComponent(input);
    case "url-decode":
      return decodeURIComponent(input);
    case "hex-encode":
      return Buffer.from(input, "utf8").toString("hex");
    case "hex-decode":
      return Buffer.from(input, "hex").toString("utf8");
  }
}

export async function hashRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: HashBody }>("/v1/hash", { schema: hashSchema }, async (req, reply) => {
    const { input, algorithm = "sha256", hmacKey } = req.body;
    const digest = hmacKey
      ? createHmac(algorithm, hmacKey).update(input).digest("hex")
      : createHash(algorithm).update(input).digest("hex");
    return reply.send({ algorithm, hmac: Boolean(hmacKey), digest, requestId: randomUUID() });
  });

  app.post<{ Body: EncodeBody }>("/v1/encode", { schema: encodeSchema }, async (req, reply) => {
    const { input, operation } = req.body;
    try {
      return reply.send({ operation, result: encode(input, operation) });
    } catch (err) {
      return reply.code(422).send({
        error: "encode_failed",
        message: err instanceof Error ? err.message : "Could not process input",
      });
    }
  });
}
