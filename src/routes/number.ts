import type { FastifyInstance } from "fastify";

const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz";

function convertBase(value: string, from: number, to: number): string | null {
  const s = value.trim().toLowerCase().replace(/^[+]/, "");
  const neg = s.startsWith("-");
  const body = neg ? s.slice(1) : s;
  if (body === "") return null;
  let acc = 0n;
  const base = BigInt(from);
  for (const ch of body) {
    const d = DIGITS.indexOf(ch);
    if (d < 0 || d >= from) return null;
    acc = acc * base + BigInt(d);
  }
  if (acc === 0n) return "0";
  let out = "";
  const toB = BigInt(to);
  while (acc > 0n) {
    out = DIGITS[Number(acc % toB)] + out;
    acc /= toB;
  }
  return neg ? "-" + out : out;
}

const ROMAN: [number, string][] = [
  [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
  [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
];

function toRoman(n: number): string {
  let out = "";
  for (const [v, sym] of ROMAN) while (n >= v) { out += sym; n -= v; }
  return out;
}

function fromRoman(s: string): number | null {
  const map: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  const up = s.toUpperCase();
  let total = 0;
  for (let i = 0; i < up.length; i++) {
    const cur = map[up[i]];
    if (!cur) return null;
    const next = map[up[i + 1]] ?? 0;
    total += cur < next ? -cur : cur;
  }
  return toRoman(total) === up ? total : null;
}

export async function numberRoutes(app: FastifyInstance): Promise<void> {
  app.post<{
    Body: { value: number; locale?: string; style?: "decimal" | "currency" | "percent"; currency?: string; maximumFractionDigits?: number };
  }>(
    "/v1/number/format",
    {
      schema: {
        summary: "Locale-aware number / currency / percent formatting",
        tags: ["number"],
        body: {
          type: "object",
          required: ["value"],
          properties: {
            value: { type: "number" },
            locale: { type: "string", maxLength: 16, default: "en-US" },
            style: { type: "string", enum: ["decimal", "currency", "percent"], default: "decimal" },
            currency: { type: "string", maxLength: 3 },
            maximumFractionDigits: { type: "integer", minimum: 0, maximum: 20 },
          },
        },
      },
    },
    async (req, reply) => {
      const { value, locale = "en-US", style = "decimal", currency, maximumFractionDigits } = req.body;
      if (style === "currency" && !currency) {
        return reply.code(422).send({ error: "currency_required", message: "Provide `currency` (e.g. USD) for currency style." });
      }
      try {
        const formatted = new Intl.NumberFormat(locale, {
          style,
          currency,
          maximumFractionDigits,
        }).format(value);
        return { value, style, locale, formatted };
      } catch (e) {
        return reply.code(422).send({ error: "format_failed", message: e instanceof Error ? e.message : "Invalid options." });
      }
    },
  );

  app.post<{ Body: { value: string; fromBase: number; toBase: number } }>(
    "/v1/number/base",
    {
      schema: {
        summary: "Convert an integer between bases (2–36)",
        tags: ["number"],
        body: {
          type: "object",
          required: ["value", "fromBase", "toBase"],
          properties: {
            value: { type: "string", maxLength: 4096 },
            fromBase: { type: "integer", minimum: 2, maximum: 36 },
            toBase: { type: "integer", minimum: 2, maximum: 36 },
          },
        },
      },
    },
    async (req, reply) => {
      const result = convertBase(req.body.value, req.body.fromBase, req.body.toBase);
      if (result === null) {
        return reply.code(422).send({ error: "invalid_number", message: `"${req.body.value}" is not a valid base-${req.body.fromBase} integer.` });
      }
      return { value: req.body.value, fromBase: req.body.fromBase, toBase: req.body.toBase, result };
    },
  );

  app.post<{ Body: { value: string | number; to?: "roman" | "arabic" } }>(
    "/v1/number/roman",
    {
      schema: {
        summary: "Convert between Roman numerals and integers (1–3999)",
        tags: ["number"],
        body: {
          type: "object",
          required: ["value"],
          properties: {
            value: { type: ["string", "number"] },
            to: { type: "string", enum: ["roman", "arabic"], default: "roman" },
          },
        },
      },
    },
    async (req, reply) => {
      const to = req.body.to ?? "roman";
      if (to === "roman") {
        const n = Number(req.body.value);
        if (!Number.isInteger(n) || n < 1 || n > 3999) {
          return reply.code(422).send({ error: "out_of_range", message: "Provide an integer 1–3999." });
        }
        return { result: toRoman(n) };
      }
      const n = fromRoman(String(req.body.value));
      if (n === null) return reply.code(422).send({ error: "invalid_roman", message: "Not a valid Roman numeral." });
      return { result: n };
    },
  );
}
