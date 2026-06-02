import type { FastifyInstance } from "fastify";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buf: Buffer): string {
  let bits = 0, value = 0, out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) { out += ALPHABET[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  while (out.length % 8 !== 0) out += "=";
  return out;
}

function base32Decode(input: string): Buffer | null {
  const clean = input.toUpperCase().replace(/=+$/, "").replace(/\s/g, "");
  let bits = 0, value = 0;
  const bytes: number[] = [];
  for (const ch of clean) {
    const idx = ALPHABET.indexOf(ch);
    if (idx < 0) return null;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) { bytes.push((value >>> (bits - 8)) & 0xff); bits -= 8; }
  }
  return Buffer.from(bytes);
}

export async function encodingRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: { input: string; action?: "encode" | "decode" } }>(
    "/v1/encode/base32",
    {
      schema: {
        summary: "Base32 encode or decode (RFC 4648)",
        tags: ["data"],
        body: {
          type: "object",
          required: ["input"],
          properties: {
            input: { type: "string", maxLength: 200_000 },
            action: { type: "string", enum: ["encode", "decode"], default: "encode" },
          },
        },
      },
    },
    async (req, reply) => {
      const action = req.body.action ?? "encode";
      if (action === "encode") {
        return { action, result: base32Encode(Buffer.from(req.body.input, "utf8")) };
      }
      const decoded = base32Decode(req.body.input);
      if (!decoded) return reply.code(422).send({ error: "invalid_base32", message: "Input is not valid Base32." });
      return { action, result: decoded.toString("utf8") };
    },
  );
}
