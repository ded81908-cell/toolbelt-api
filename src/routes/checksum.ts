import type { FastifyInstance } from "fastify";

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

export async function checksumRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: { text: string } }>(
    "/v1/checksum/crc32",
    {
      schema: {
        summary: "CRC32 checksum of a string",
        tags: ["crypto"],
        body: { type: "object", required: ["text"], properties: { text: { type: "string", maxLength: 1_000_000 } } },
      },
    },
    async (req) => {
      const value = crc32(Buffer.from(req.body.text, "utf8"));
      return { crc32: value, hex: value.toString(16).padStart(8, "0") };
    },
  );
}
