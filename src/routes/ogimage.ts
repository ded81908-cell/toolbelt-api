import type { FastifyInstance } from "fastify";

interface OgBody {
  title?: string;
  subtitle?: string;
  badge?: string;
  theme?: "light" | "dark" | "indigo" | "sunset";
  width?: number;
  height?: number;
}

const THEMES: Record<string, { bg: string; bg2: string; fg: string; muted: string; accent: string }> = {
  light: { bg: "#ffffff", bg2: "#f1f5f9", fg: "#0f172a", muted: "#475569", accent: "#2563eb" },
  dark: { bg: "#0f172a", bg2: "#1e293b", fg: "#f8fafc", muted: "#94a3b8", accent: "#38bdf8" },
  indigo: { bg: "#1e1b4b", bg2: "#312e81", fg: "#eef2ff", muted: "#c7d2fe", accent: "#a78bfa" },
  sunset: { bg: "#7c2d12", bg2: "#b45309", fg: "#fff7ed", muted: "#fed7aa", accent: "#fde047" },
};

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Naive width-aware wrapping good enough for headline text on a card. */
function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxChars) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current = (current + " " + word).trim();
    }
    if (lines.length === maxLines - 1 && current.length > maxChars) break;
  }
  if (current) lines.push(current.trim());
  if (lines.length > maxLines) {
    const trimmed = lines.slice(0, maxLines);
    trimmed[maxLines - 1] = trimmed[maxLines - 1].replace(/\.*$/, "") + "…";
    return trimmed;
  }
  return lines;
}

const schema = {
  summary: "Generate a social / Open Graph card image",
  description:
    "Returns a 1200×630 (default) SVG social card. Embed directly via <meta og:image> or rasterize client-side. No AI cost.",
  tags: ["images"],
  body: {
    type: "object",
    required: ["title"],
    properties: {
      title: { type: "string", maxLength: 200 },
      subtitle: { type: "string", maxLength: 300 },
      badge: { type: "string", maxLength: 40 },
      theme: { type: "string", enum: ["light", "dark", "indigo", "sunset"], default: "dark" },
      width: { type: "integer", minimum: 320, maximum: 2400, default: 1200 },
      height: { type: "integer", minimum: 180, maximum: 1260, default: 630 },
    },
  },
};

export async function ogImageRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: OgBody }>("/v1/og-image", { schema }, async (req, reply) => {
    const {
      title = "",
      subtitle = "",
      badge = "",
      theme = "dark",
      width = 1200,
      height = 630,
    } = req.body;

    const t = THEMES[theme] ?? THEMES.dark;
    const titleLines = wrap(title, 26, 3);
    const titleFontSize = titleLines.length > 2 ? 64 : 78;
    const startY = height / 2 - ((titleLines.length - 1) * titleFontSize) / 2 - (subtitle ? 20 : 0);

    const titleTspans = titleLines
      .map(
        (line, i) =>
          `<text x="80" y="${startY + i * (titleFontSize + 12)}" font-size="${titleFontSize}" font-weight="800" fill="${t.fg}">${escapeXml(line)}</text>`,
      )
      .join("\n    ");

    const badgeEl = badge
      ? `<g>
      <rect x="80" y="72" rx="22" ry="22" width="${Math.min(60 + badge.length * 18, width - 160)}" height="44" fill="${t.accent}" opacity="0.18"/>
      <text x="104" y="102" font-size="26" font-weight="700" fill="${t.accent}">${escapeXml(badge.toUpperCase())}</text>
    </g>`
      : "";

    const subtitleEl = subtitle
      ? `<text x="80" y="${startY + titleLines.length * (titleFontSize + 12) + 24}" font-size="34" fill="${t.muted}">${escapeXml(wrap(subtitle, 60, 1)[0] ?? "")}</text>`
      : "";

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="'Segoe UI', system-ui, -apple-system, Helvetica, Arial, sans-serif">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${t.bg}"/>
      <stop offset="1" stop-color="${t.bg2}"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect x="0" y="${height - 12}" width="${width}" height="12" fill="${t.accent}"/>
  ${badgeEl}
  ${titleTspans}
  ${subtitleEl}
</svg>`;

    return reply.header("content-type", "image/svg+xml").send(svg);
  });
}
