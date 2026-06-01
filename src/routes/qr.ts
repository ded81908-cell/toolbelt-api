import type { FastifyInstance } from "fastify";
import QRCode from "qrcode";

interface QrBody {
  text?: string;
  format?: "png" | "svg";
  size?: number;
  margin?: number;
  dark?: string;
  light?: string;
  ecc?: "L" | "M" | "Q" | "H";
}

const schema = {
  summary: "Generate a QR code",
  description:
    "Returns a QR code as PNG (default) or SVG encoding the given text/URL. Fully offline, no AI cost.",
  tags: ["images"],
  body: {
    type: "object",
    required: ["text"],
    properties: {
      text: { type: "string", maxLength: 4096, description: "Content to encode" },
      format: { type: "string", enum: ["png", "svg"], default: "png" },
      size: { type: "integer", minimum: 64, maximum: 2048, default: 512 },
      margin: { type: "integer", minimum: 0, maximum: 16, default: 2 },
      dark: { type: "string", default: "#000000ff" },
      light: { type: "string", default: "#ffffffff" },
      ecc: { type: "string", enum: ["L", "M", "Q", "H"], default: "M" },
    },
  },
};

export async function qrRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: QrBody }>("/v1/qr", { schema }, async (req, reply) => {
    const {
      text,
      format = "png",
      size = 512,
      margin = 2,
      dark = "#000000ff",
      light = "#ffffffff",
      ecc = "M",
    } = req.body;

    if (!text) {
      return reply.code(400).send({ error: "bad_request", message: "text is required" });
    }

    const options = {
      errorCorrectionLevel: ecc,
      margin,
      width: size,
      color: { dark, light },
    } as const;

    if (format === "svg") {
      const svg = await QRCode.toString(text, { ...options, type: "svg" });
      return reply.header("content-type", "image/svg+xml").send(svg);
    }

    const buffer = await QRCode.toBuffer(text, { ...options, type: "png" });
    return reply.header("content-type", "image/png").send(buffer);
  });
}
