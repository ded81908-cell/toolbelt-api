import type { FastifyInstance } from "fastify";
import QRCode from "qrcode";

interface WifiBody {
  ssid: string;
  password?: string;
  encryption?: "WPA" | "WEP" | "nopass";
  hidden?: boolean;
  format?: "png" | "svg";
  size?: number;
}

interface VcardBody {
  name: string;
  org?: string;
  title?: string;
  phone?: string;
  email?: string;
  url?: string;
  format?: "png" | "svg";
  size?: number;
}

// Escape special chars per the Wi-Fi/MeCard-style QR spec.
function esc(s: string): string {
  return s.replace(/([\\;,:"])/g, "\\$1");
}

async function render(payload: string, format: "png" | "svg", size: number): Promise<{ ct: string; body: string | Buffer }> {
  if (format === "svg") {
    const svg = await QRCode.toString(payload, { type: "svg", width: size, margin: 2 });
    return { ct: "image/svg+xml", body: svg };
  }
  const dataUrl = await QRCode.toDataURL(payload, { width: size, margin: 2 });
  return { ct: "image/png", body: Buffer.from(dataUrl.split(",")[1], "base64") };
}

export async function qrExtraRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: WifiBody }>(
    "/v1/qr/wifi",
    {
      schema: {
        summary: "Wi-Fi join QR code",
        description: "Generates a QR that phones can scan to join a Wi-Fi network.",
        tags: ["images", "qr"],
        body: {
          type: "object",
          required: ["ssid"],
          properties: {
            ssid: { type: "string", maxLength: 256 },
            password: { type: "string", maxLength: 256 },
            encryption: { type: "string", enum: ["WPA", "WEP", "nopass"], default: "WPA" },
            hidden: { type: "boolean", default: false },
            format: { type: "string", enum: ["png", "svg"], default: "png" },
            size: { type: "integer", minimum: 64, maximum: 1024, default: 256 },
          },
        },
      },
    },
    async (req, reply) => {
      const { ssid, password = "", encryption = "WPA", hidden = false, format = "png", size = 256 } = req.body;
      const type = encryption === "nopass" ? "nopass" : encryption;
      const payload = `WIFI:T:${type};S:${esc(ssid)};${type === "nopass" ? "" : `P:${esc(password)};`}${hidden ? "H:true;" : ""};`;
      const { ct, body } = await render(payload, format, size);
      return reply.header("content-type", ct).send(body);
    },
  );

  app.post<{ Body: VcardBody }>(
    "/v1/qr/vcard",
    {
      schema: {
        summary: "Contact (vCard) QR code",
        description: "Generates a QR encoding a vCard 3.0 contact card.",
        tags: ["images", "qr"],
        body: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", maxLength: 200 },
            org: { type: "string", maxLength: 200 },
            title: { type: "string", maxLength: 200 },
            phone: { type: "string", maxLength: 64 },
            email: { type: "string", maxLength: 200 },
            url: { type: "string", maxLength: 500 },
            format: { type: "string", enum: ["png", "svg"], default: "png" },
            size: { type: "integer", minimum: 64, maximum: 1024, default: 256 },
          },
        },
      },
    },
    async (req, reply) => {
      const { name, org, title, phone, email, url, format = "png", size = 256 } = req.body;
      const lines = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `FN:${name}`,
        org ? `ORG:${org}` : "",
        title ? `TITLE:${title}` : "",
        phone ? `TEL:${phone}` : "",
        email ? `EMAIL:${email}` : "",
        url ? `URL:${url}` : "",
        "END:VCARD",
      ].filter(Boolean);
      const { ct, body } = await render(lines.join("\n"), format, size);
      return reply.header("content-type", ct).send(body);
    },
  );
}
