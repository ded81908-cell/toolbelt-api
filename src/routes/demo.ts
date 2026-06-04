import type { FastifyInstance } from "fastify";
import { createHash, randomUUID } from "node:crypto";
import {
  hiraToKata,
  kataToHira,
  romanize,
  toHankaku,
  toZenkaku,
} from "../lib/jp.js";

/**
 * Public, key-free demo endpoint that powers the live widget on the landing
 * page. It intentionally exposes only a small whitelist of cheap, deterministic
 * operations so visitors can try the product before signing up on RapidAPI.
 *
 * Safety: marked `public` (bypasses auth + billing), capped input length, and
 * a small in-memory per-IP rate limiter so it can't be abused for free compute.
 */

const MAX_INPUT = 1000;
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 40;

const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now > rec.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  rec.count += 1;
  return rec.count > MAX_PER_WINDOW;
}

// Occasionally evict stale buckets so the map can't grow unbounded.
function sweep(): void {
  const now = Date.now();
  for (const [ip, rec] of hits) if (now > rec.resetAt) hits.delete(ip);
}

function slug(text: string): string {
  return romanize(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

const ops: Record<string, (text: string) => string> = {
  "jp.hankaku": toHankaku,
  "jp.zenkaku": toZenkaku,
  "jp.hiragana": kataToHira,
  "jp.katakana": hiraToKata,
  "jp.romaji": romanize,
  "jp.slug": slug,
  "text.upper": (t) => t.toUpperCase(),
  "text.lower": (t) => t.toLowerCase(),
  "hash.sha256": (t) => createHash("sha256").update(t).digest("hex"),
  "hash.md5": (t) => createHash("md5").update(t).digest("hex"),
  "base64.encode": (t) => Buffer.from(t, "utf8").toString("base64"),
  "base64.decode": (t) => Buffer.from(t, "base64").toString("utf8"),
  "uuid.v4": () => randomUUID(),
};

interface DemoBody {
  op: string;
  text: string;
}

export async function demoRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: DemoBody }>(
    "/demo/run",
    {
      config: { public: true },
      schema: {
        summary: "Key-free demo runner for the landing page",
        description:
          "Runs a small whitelist of cheap utilities without an API key. " +
          "For evaluation only — production traffic should use the /v1/* endpoints via RapidAPI.",
        tags: ["meta"],
        body: {
          type: "object",
          required: ["op", "text"],
          properties: {
            op: { type: "string", enum: Object.keys(ops) },
            text: { type: "string", maxLength: MAX_INPUT },
          },
        },
      },
    },
    async (req, reply) => {
      if (rateLimited(req.ip)) {
        if (hits.size > 5000) sweep();
        return reply.code(429).send({
          error: "demo_rate_limited",
          message:
            "Demo limit reached. Grab a free API key on RapidAPI for unmetered access.",
        });
      }
      const { op, text } = req.body;
      const fn = ops[op];
      if (!fn) {
        return reply.code(400).send({ error: "unknown_op", message: `Unknown op: ${op}` });
      }
      return { op, result: fn(text) };
    },
  );
}
