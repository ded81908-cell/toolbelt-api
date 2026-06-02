import type { FastifyInstance } from "fastify";

const MIME: Record<string, string> = {
  txt: "text/plain", csv: "text/csv", html: "text/html", htm: "text/html",
  css: "text/css", js: "text/javascript", mjs: "text/javascript", json: "application/json",
  xml: "application/xml", yaml: "application/yaml", yml: "application/yaml",
  md: "text/markdown", pdf: "application/pdf", zip: "application/zip", gz: "application/gzip",
  tar: "application/x-tar", rar: "application/vnd.rar", "7z": "application/x-7z-compressed",
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif",
  webp: "image/webp", svg: "image/svg+xml", ico: "image/x-icon", bmp: "image/bmp",
  tiff: "image/tiff", avif: "image/avif", heic: "image/heic",
  mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg", flac: "audio/flac", m4a: "audio/mp4",
  mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime", avi: "video/x-msvideo", mkv: "video/x-matroska",
  doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint", pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ttf: "font/ttf", otf: "font/otf", woff: "font/woff", woff2: "font/woff2",
  wasm: "application/wasm", bin: "application/octet-stream",
};

export async function mimeRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: { filename: string } }>(
    "/v1/mime",
    {
      schema: {
        summary: "Look up the MIME type for a filename or extension",
        tags: ["files"],
        body: { type: "object", required: ["filename"], properties: { filename: { type: "string", maxLength: 512 } } },
      },
    },
    async (req) => {
      const ext = req.body.filename.toLowerCase().split(".").pop() ?? "";
      const mime = MIME[ext] ?? "application/octet-stream";
      return { extension: ext, mime, known: ext in MIME };
    },
  );
}
