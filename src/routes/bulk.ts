import { createHash } from "node:crypto";
import type { FastifyInstance } from "fastify";
import QRCode from "qrcode";

interface QrBulkBody {
  items: { text: string; id?: string }[];
  format?: "png" | "svg";
  size?: number;
  margin?: number;
  ecc?: "L" | "M" | "Q" | "H";
}

interface HashBulkBody {
  inputs: string[];
  algorithm?: "md5" | "sha1" | "sha256" | "sha512";
}

const MAX_ITEMS = 200;

export async function bulkRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: QrBulkBody }>(
    "/v1/qr/bulk",
    {
      schema: {
        summary: "Generate many QR codes in one call",
        description:
          "Up to 200 QR codes per request, returned as data URIs (PNG) or SVG strings. Saves round-trips and justifies higher tiers.",
        tags: ["bulk", "images"],
        body: {
          type: "object",
          required: ["items"],
          properties: {
            items: {
              type: "array",
              minItems: 1,
              maxItems: MAX_ITEMS,
              items: {
                type: "object",
                required: ["text"],
                properties: {
                  text: { type: "string", maxLength: 4096 },
                  id: { type: "string", maxLength: 128 },
                },
              },
            },
            format: { type: "string", enum: ["png", "svg"], default: "png" },
            size: { type: "integer", minimum: 64, maximum: 1024, default: 256 },
            margin: { type: "integer", minimum: 0, maximum: 16, default: 2 },
            ecc: { type: "string", enum: ["L", "M", "Q", "H"], default: "M" },
          },
        },
      },
    },
    async (req) => {
      const { items, format = "png", size = 256, margin = 2, ecc = "M" } = req.body;
      const options = { errorCorrectionLevel: ecc, margin, width: size } as const;

      const results = await Promise.all(
        items.map(async (item, index) => {
          const id = item.id ?? String(index);
          if (format === "svg") {
            const svg = await QRCode.toString(item.text, { ...options, type: "svg" });
            return { id, format, data: svg };
          }
          const dataUri = await QRCode.toDataURL(item.text, { ...options });
          return { id, format, data: dataUri };
        }),
      );

      return { count: results.length, results };
    },
  );

  app.post<{ Body: HashBulkBody }>(
    "/v1/hash/bulk",
    {
      schema: {
        summary: "Hash many strings in one call",
        tags: ["bulk", "crypto"],
        body: {
          type: "object",
          required: ["inputs"],
          properties: {
            inputs: {
              type: "array",
              minItems: 1,
              maxItems: MAX_ITEMS * 25,
              items: { type: "string", maxLength: 100_000 },
            },
            algorithm: {
              type: "string",
              enum: ["md5", "sha1", "sha256", "sha512"],
              default: "sha256",
            },
          },
        },
      },
    },
    async (req) => {
      const { inputs, algorithm = "sha256" } = req.body;
      const digests = inputs.map((input) =>
        createHash(algorithm).update(input).digest("hex"),
      );
      return { algorithm, count: digests.length, digests };
    },
  );
}
