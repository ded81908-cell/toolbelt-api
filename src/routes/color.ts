import type { FastifyInstance } from "fastify";

interface RGB { r: number; g: number; b: number; }

function parseColor(input: string): RGB | null {
  const s = input.trim().toLowerCase();
  let m = /^#?([0-9a-f]{3})$/.exec(s);
  if (m) {
    const [a, b, c] = m[1];
    return { r: parseInt(a + a, 16), g: parseInt(b + b, 16), b: parseInt(c + c, 16) };
  }
  m = /^#?([0-9a-f]{6})$/.exec(s);
  if (m) {
    const n = parseInt(m[1], 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  m = /^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(s);
  if (m) {
    const r = +m[1], g = +m[2], b = +m[3];
    if ([r, g, b].every((v) => v >= 0 && v <= 255)) return { r, g, b };
  }
  return null;
}

function toHex({ r, g, b }: RGB): string {
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

function rgbToHsl({ r, g, b }: RGB): { h: number; s: number; l: number } {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function relativeLuminance({ r, g, b }: RGB): number {
  const lin = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

export async function colorRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: { color: string } }>(
    "/v1/color/convert",
    {
      schema: {
        summary: "Convert a color between hex / rgb / hsl",
        tags: ["color"],
        body: { type: "object", required: ["color"], properties: { color: { type: "string", maxLength: 64 } } },
      },
    },
    async (req, reply) => {
      const rgb = parseColor(req.body.color);
      if (!rgb) return reply.code(422).send({ error: "invalid_color", message: "Use #hex, hex or rgb(r,g,b)." });
      const { h, s, l } = rgbToHsl(rgb);
      return { hex: toHex(rgb), rgb, hsl: { h, s, l }, css: { rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, hsl: `hsl(${h}, ${s}%, ${l}%)` } };
    },
  );

  app.post<{ Body: { foreground: string; background: string } }>(
    "/v1/color/contrast",
    {
      schema: {
        summary: "WCAG contrast ratio between two colors",
        description: "Returns the contrast ratio and AA/AAA pass flags for normal and large text.",
        tags: ["color"],
        body: {
          type: "object",
          required: ["foreground", "background"],
          properties: { foreground: { type: "string", maxLength: 64 }, background: { type: "string", maxLength: 64 } },
        },
      },
    },
    async (req, reply) => {
      const fg = parseColor(req.body.foreground);
      const bg = parseColor(req.body.background);
      if (!fg || !bg) return reply.code(422).send({ error: "invalid_color", message: "Use #hex, hex or rgb(r,g,b)." });
      const l1 = relativeLuminance(fg), l2 = relativeLuminance(bg);
      const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      const r = Math.round(ratio * 100) / 100;
      return {
        ratio: r,
        normalText: { AA: r >= 4.5, AAA: r >= 7 },
        largeText: { AA: r >= 3, AAA: r >= 4.5 },
      };
    },
  );
}
