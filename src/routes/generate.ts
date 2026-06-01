import { randomBytes, randomInt, randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";

interface UuidQuery {
  count?: number;
}

interface PasswordQuery {
  length?: number;
  count?: number;
  symbols?: boolean;
  numbers?: boolean;
  uppercase?: boolean;
}

interface SlugBody {
  text: string;
}

const LOWER = "abcdefghijklmnopqrstuvwxyz";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NUMBERS = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.?";

function makePassword(opts: Required<Omit<PasswordQuery, "count">>): string {
  let alphabet = LOWER;
  if (opts.uppercase) alphabet += UPPER;
  if (opts.numbers) alphabet += NUMBERS;
  if (opts.symbols) alphabet += SYMBOLS;
  let out = "";
  for (let i = 0; i < opts.length; i++) {
    out += alphabet[randomInt(alphabet.length)];
  }
  return out;
}

function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

export async function generateRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Querystring: UuidQuery }>(
    "/v1/uuid",
    {
      schema: {
        summary: "Generate one or more UUID v4 values",
        tags: ["generators"],
        querystring: {
          type: "object",
          properties: { count: { type: "integer", minimum: 1, maximum: 1000, default: 1 } },
        },
      },
    },
    async (req) => {
      const count = req.query.count ?? 1;
      return { uuids: Array.from({ length: count }, () => randomUUID()) };
    },
  );

  app.get<{ Querystring: PasswordQuery }>(
    "/v1/password",
    {
      schema: {
        summary: "Generate cryptographically strong passwords",
        tags: ["generators"],
        querystring: {
          type: "object",
          properties: {
            length: { type: "integer", minimum: 6, maximum: 256, default: 20 },
            count: { type: "integer", minimum: 1, maximum: 100, default: 1 },
            symbols: { type: "boolean", default: true },
            numbers: { type: "boolean", default: true },
            uppercase: { type: "boolean", default: true },
          },
        },
      },
    },
    async (req) => {
      const {
        length = 20,
        count = 1,
        symbols = true,
        numbers = true,
        uppercase = true,
      } = req.query;
      return {
        passwords: Array.from({ length: count }, () =>
          makePassword({ length, symbols, numbers, uppercase }),
        ),
      };
    },
  );

  app.get<{ Querystring: { bytes?: number } }>(
    "/v1/token",
    {
      schema: {
        summary: "Generate a random URL-safe token",
        tags: ["generators"],
        querystring: {
          type: "object",
          properties: { bytes: { type: "integer", minimum: 8, maximum: 256, default: 32 } },
        },
      },
    },
    async (req) => {
      const size = req.query.bytes ?? 32;
      return { token: randomBytes(size).toString("base64url") };
    },
  );

  app.post<{ Body: SlugBody }>(
    "/v1/slug",
    {
      schema: {
        summary: "Slugify a string",
        tags: ["generators"],
        body: {
          type: "object",
          required: ["text"],
          properties: { text: { type: "string", maxLength: 2000 } },
        },
      },
    },
    async (req) => {
      return { slug: slugify(req.body.text) };
    },
  );
}
