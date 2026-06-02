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

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1).fill(0);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

export async function textRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: { a: string; b: string } }>(
    "/v1/text/similarity",
    {
      schema: {
        summary: "String similarity (Levenshtein distance + ratio)",
        tags: ["text"],
        body: {
          type: "object",
          required: ["a", "b"],
          properties: { a: { type: "string", maxLength: 10_000 }, b: { type: "string", maxLength: 10_000 } },
        },
      },
    },
    async (req) => {
      const { a, b } = req.body;
      const distance = levenshtein(a, b);
      const maxLen = Math.max(a.length, b.length);
      const similarity = maxLen === 0 ? 1 : 1 - distance / maxLen;
      return { distance, similarity: Math.round(similarity * 10000) / 10000 };
    },
  );

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

  app.post<{ Body: { a: string; b: string } }>(
    "/v1/text/diff",
    {
      schema: {
        summary: "Line-level diff between two texts",
        description: "Returns an array of ops (eq/add/del) plus added/removed counts. Uses an LCS.",
        tags: ["text"],
        body: {
          type: "object",
          required: ["a", "b"],
          properties: { a: { type: "string", maxLength: 200_000 }, b: { type: "string", maxLength: 200_000 } },
        },
      },
    },
    async (req) => {
      const a = req.body.a.split("\n");
      const b = req.body.b.split("\n");
      const n = a.length, m = b.length;
      // LCS length table.
      const lcs = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
      for (let i = n - 1; i >= 0; i--)
        for (let j = m - 1; j >= 0; j--)
          lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);

      const ops: { type: "eq" | "add" | "del"; line: string }[] = [];
      let i = 0, j = 0, added = 0, removed = 0;
      while (i < n && j < m) {
        if (a[i] === b[j]) { ops.push({ type: "eq", line: a[i] }); i++; j++; }
        else if (lcs[i + 1][j] >= lcs[i][j + 1]) { ops.push({ type: "del", line: a[i] }); i++; removed++; }
        else { ops.push({ type: "add", line: b[j] }); j++; added++; }
      }
      while (i < n) { ops.push({ type: "del", line: a[i++] }); removed++; }
      while (j < m) { ops.push({ type: "add", line: b[j++] }); added++; }
      return { added, removed, ops };
    },
  );

  app.post<{ Body: { text: string; action?: "encode" | "decode" } }>(
    "/v1/html/entities",
    {
      schema: {
        summary: "Encode or decode HTML entities",
        tags: ["text"],
        body: {
          type: "object",
          required: ["text"],
          properties: {
            text: { type: "string", maxLength: 500_000 },
            action: { type: "string", enum: ["encode", "decode"], default: "encode" },
          },
        },
      },
    },
    async (req) => {
      const { text } = req.body;
      const action = req.body.action ?? "encode";
      if (action === "encode") {
        const result = text
          .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
        return { action, result };
      }
      const named: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
      const result = text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (m, code: string) => {
        if (code[0] === "#") {
          const cp = code[1] === "x" || code[1] === "X" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
          return Number.isFinite(cp) ? String.fromCodePoint(cp) : m;
        }
        return named[code] ?? m;
      });
      return { action, result };
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
