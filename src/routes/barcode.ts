import type { FastifyInstance } from "fastify";
import bwipjs from "bwip-js";

// Common, widely-used symbologies. bwip-js supports many more; we allowlist the
// ones most retail/logistics/EC customers actually ask for.
const SYMBOLOGIES = [
  "code128",
  "code39",
  "ean13",
  "ean8",
  "upca",
  "itf14",
  "qrcode",
  "datamatrix",
  "pdf417",
] as const;

interface BarcodeBody {
  type: (typeof SYMBOLOGIES)[number];
  text: string;
  format?: "png" | "svg";
  scale?: number;
  height?: number;
  includetext?: boolean;
}

export async function barcodeRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: BarcodeBody }>(
    "/v1/barcode",
    {
      schema: {
        summary: "Generate a barcode (Code128, EAN, UPC, ITF, DataMatrix, PDF417, …)",
        description:
          "Retail/logistics barcodes as PNG or SVG via bwip-js. Covers the symbologies EC and warehouse customers need.",
        tags: ["images", "barcode"],
        body: {
          type: "object",
          required: ["type", "text"],
          properties: {
            type: { type: "string", enum: SYMBOLOGIES as unknown as string[] },
            text: { type: "string", maxLength: 2048 },
            format: { type: "string", enum: ["png", "svg"], default: "png" },
            scale: { type: "integer", minimum: 1, maximum: 10, default: 3 },
            height: { type: "integer", minimum: 4, maximum: 100, default: 12 },
            includetext: { type: "boolean", default: true },
          },
        },
      },
    },
    async (req, reply) => {
      const { type, text, format = "png", scale = 3, height = 12, includetext = true } = req.body;
      const options = {
        bcid: type,
        text,
        scale,
        height,
        includetext,
        textxalign: "center" as const,
      };

      try {
        if (format === "svg") {
          const svg = bwipjs.toSVG(options);
          return reply.header("content-type", "image/svg+xml").send(svg);
        }
        const png = await bwipjs.toBuffer(options);
        return reply.header("content-type", "image/png").send(png);
      } catch (err) {
        return reply.code(422).send({
          error: "barcode_failed",
          message:
            err instanceof Error
              ? err.message
              : `Could not encode "${text}" as ${type}. Check the value matches the symbology.`,
        });
      }
    },
  );
}
