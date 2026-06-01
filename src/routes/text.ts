import type { FastifyInstance } from "fastify";
import sanitizeHtml from "sanitize-html";

type CaseTarget =
  | "lower" | "upper" | "title" | "sentence"
  | "camel" | "pascal" | "snake" | "kebab" | "constant";

function words(s: string): string[] {
  return s
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[\s_\-./]+/)
    .filter(Boolean);
}

function toCase(text: string, target: CaseTarget): string {
  const w = words(text);
  switch (target) {
    case "lower": return text.toLowerCase();
    case "upper": return text.toUpperCase();
    case "title": return w.map((x) => x[0].toUpperCase() + x.slice(1).toLowerCase()).join(" ");
    case "sentence": {
      const lower = text.toLowerCase();
      return lower.replace(/(^\s*|[.!?]\s+)([a-z])/g, (_, p, c) => p + c.toUpperCase());
    }
    case "camel": return w.map((x, i) => (i === 0 ? x.toLowerCase() : x[0].toUpperCase() + x.slice(1).toLowerCase())).join("");
    case "pascal": return w.map((x) => x[0].toUpperCase() + x.slice(1).toLowerCase()).join("");
    case "snake": return w.map((x) => x.toLowerCase()).join("_");
    case "kebab": return w.map((x) => x.toLowerCase()).join("-");
    case "constant": return w.map((x) => x.toUpperCase()).join("_");
  }
}

const WORD_LIST = (
  "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor " +
  "incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud " +
  "exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute " +
  "irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur"
).split(" ");

function lorem(units: "words" | "sentences" | "paragraphs", count: number): string {
  const word = (i: number): string => WORD_LIST[i % WORD_LIST.length];
  const sentence = (seed: number): string => {
    const len = 6 + (seed % 9);
    const parts = Array.from({ length: len }, (_, i) => word(seed + i * 3));
    const s = parts.join(" ");
    return s[0].toUpperCase() + s.slice(1) + ".";
  };
  if (units === "words") return Array.from({ length: count }, (_, i) => word(i)).join(" ");
  if (units === "sentences") return Array.from({ length: count }, (_, i) => sentence(i * 7)).join(" ");
  return Array.from({ length: count }, (_, p) =>
    Array.from({ length: 4 }, (_, i) => sentence(p * 31 + i * 7)).join(" "),
  ).join("\n\n");
}

export async function textRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: { text: string; target: CaseTarget } }>(
    "/v1/text/case",
    {
      schema: {
        summary: "Convert text case (camel, snake, kebab, title, …)",
        tags: ["text"],
        body: {
          type: "object",
          required: ["text", "target"],
          properties: {
            text: { type: "string", maxLength: 100_000 },
            target: { type: "string", enum: ["lower", "upper", "title", "sentence", "camel", "pascal", "snake", "kebab", "constant"] },
          },
        },
      },
    },
    async (req) => ({ result: toCase(req.body.text, req.body.target) }),
  );

  app.post<{ Body: { text: string } }>(
    "/v1/text/stats",
    {
      schema: {
        summary: "Word/character/reading-time statistics",
        tags: ["text"],
        body: { type: "object", required: ["text"], properties: { text: { type: "string", maxLength: 500_000 } } },
      },
    },
    async (req) => {
      const t = req.body.text;
      const wordCount = (t.match(/\S+/g) ?? []).length;
      const sentences = (t.match(/[^.!?]+[.!?]+/g) ?? []).length || (t.trim() ? 1 : 0);
      const paragraphs = t.split(/\n\s*\n/).filter((p) => p.trim()).length;
      return {
        characters: t.length,
        charactersNoSpaces: t.replace(/\s/g, "").length,
        words: wordCount,
        sentences,
        lines: t === "" ? 0 : t.split(/\n/).length,
        paragraphs,
        readingTimeSeconds: Math.round((wordCount / 200) * 60),
      };
    },
  );

  app.post<{ Body: { units?: "words" | "sentences" | "paragraphs"; count?: number } }>(
    "/v1/lorem",
    {
      schema: {
        summary: "Generate lorem ipsum placeholder text",
        tags: ["text", "generators"],
        body: {
          type: "object",
          properties: {
            units: { type: "string", enum: ["words", "sentences", "paragraphs"], default: "paragraphs" },
            count: { type: "integer", minimum: 1, maximum: 200, default: 3 },
          },
        },
      },
    },
    async (req) => {
      const units = req.body.units ?? "paragraphs";
      const count = req.body.count ?? 3;
      return { units, count, text: lorem(units, count) };
    },
  );

  app.post<{ Body: { html: string } }>(
    "/v1/html/strip",
    {
      schema: {
        summary: "Strip HTML tags to plain text",
        tags: ["text", "documents"],
        body: { type: "object", required: ["html"], properties: { html: { type: "string", maxLength: 500_000 } } },
      },
    },
    async (req) => {
      const text = sanitizeHtml(req.body.html, { allowedTags: [], allowedAttributes: {} })
        .replace(/&nbsp;/g, " ")
        .replace(/[ \t]+\n/g, "\n")
        .trim();
      return { text };
    },
  );
}
