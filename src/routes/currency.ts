import type { FastifyInstance } from "fastify";

interface ConvertBody {
  from: string;
  to: string;
  amount: number;
  /** Optional caller-supplied rates (relative to `base`) for offline/deterministic conversion. */
  rates?: Record<string, number>;
  base?: string;
}

interface CachedRates {
  base: string;
  rates: Record<string, number>;
  fetchedAt: number;
}

const TTL_MS = 60 * 60 * 1000; // 1h
const cache = new Map<string, CachedRates>();

/**
 * Fetch live rates from a free, no-key upstream, cached per base. Returns null if
 * the upstream is unreachable (e.g. restricted network) so callers can 503
 * gracefully — or pass their own `rates` to avoid the network entirely.
 */
async function liveRates(base: string): Promise<CachedRates | null> {
  const cached = cache.get(base);
  if (cached && Date.now() - cached.fetchedAt < TTL_MS) return cached;
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`);
    if (!res.ok) return cached ?? null;
    const data = (await res.json()) as { rates?: Record<string, number> };
    if (!data.rates) return cached ?? null;
    const fresh: CachedRates = { base, rates: data.rates, fetchedAt: Date.now() };
    cache.set(base, fresh);
    return fresh;
  } catch {
    return cached ?? null;
  }
}

function convertWith(
  rates: Record<string, number>,
  base: string,
  from: string,
  to: string,
  amount: number,
): number | null {
  const rateOf = (cur: string): number | undefined =>
    cur === base ? 1 : rates[cur];
  const rFrom = rateOf(from);
  const rTo = rateOf(to);
  if (rFrom === undefined || rTo === undefined || rFrom === 0) return null;
  const inBase = amount / rFrom;
  return inBase * rTo;
}

export async function currencyRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: ConvertBody }>(
    "/v1/currency/convert",
    {
      schema: {
        summary: "Convert an amount between currencies",
        description:
          "Pass `rates` (relative to `base`) for deterministic offline conversion, or omit them to use cached live rates. Pairs well with the invoice endpoint.",
        tags: ["currency"],
        body: {
          type: "object",
          required: ["from", "to", "amount"],
          properties: {
            from: { type: "string", minLength: 3, maxLength: 3 },
            to: { type: "string", minLength: 3, maxLength: 3 },
            amount: { type: "number" },
            base: { type: "string", minLength: 3, maxLength: 3, default: "USD" },
            rates: {
              type: "object",
              additionalProperties: { type: "number" },
            },
          },
        },
      },
    },
    async (req, reply) => {
      const from = req.body.from.toUpperCase();
      const to = req.body.to.toUpperCase();
      const { amount } = req.body;

      if (req.body.rates) {
        const base = (req.body.base ?? "USD").toUpperCase();
        const result = convertWith(req.body.rates, base, from, to, amount);
        if (result === null) {
          return reply.code(422).send({
            error: "unknown_currency",
            message: `Provided rates do not cover ${from} and/or ${to} (base ${base}).`,
          });
        }
        return { from, to, amount, result, source: "provided" };
      }

      const live = await liveRates(from);
      if (!live) {
        return reply.code(503).send({
          error: "rates_unavailable",
          message:
            "Live FX rates are temporarily unavailable. Retry, or pass a `rates` map to convert offline.",
        });
      }
      const result = convertWith(live.rates, live.base, from, to, amount);
      if (result === null) {
        return reply.code(422).send({
          error: "unknown_currency",
          message: `No rate available for ${to}.`,
        });
      }
      return {
        from,
        to,
        amount,
        result,
        source: "live",
        asOf: new Date(live.fetchedAt).toISOString(),
      };
    },
  );
}
