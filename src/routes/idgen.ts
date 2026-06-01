import { randomBytes, randomInt } from "node:crypto";
import type { FastifyInstance } from "fastify";

const NANO_ALPHABET = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function nanoid(size: number, alphabet: string): string {
  const bytes = randomBytes(size);
  let id = "";
  for (let i = 0; i < size; i++) id += alphabet[bytes[i] % alphabet.length];
  return id;
}

function ulid(): string {
  let time = Date.now();
  let ts = "";
  for (let i = 0; i < 10; i++) { ts = CROCKFORD[time % 32] + ts; time = Math.floor(time / 32); }
  let rand = "";
  const bytes = randomBytes(16);
  for (let i = 0; i < 16; i++) rand += CROCKFORD[bytes[i] % 32];
  return ts + rand;
}

// Compact EFF-style-ish wordlist for passphrases (kept small but varied).
const WORDS = (
  "able acid aged also area army away baby back ball band bank base bath bear " +
  "beat been beer bell belt best bird blue boat body bone book boot born boss " +
  "both bowl bulk burn bush busy cake call calm came camp card care case cash " +
  "cast cell chat chip city club coal coat code cold come cook cool cope copy " +
  "core corn cost crew crop dark data date dawn days dead deal dean dear debt " +
  "deep deer desk dial diet dirt dish dock door dose down draw drew drop drug " +
  "duck dust duty each earn ease east easy edge else even ever evil exit face " +
  "fact fade fail fair fall farm fast fate fear feed feel feet fell felt file " +
  "fill film find fine fire firm fish five flag flat flow folk food foot ford " +
  "form fort four free frog fuel full fund gain game gate gave gear gene gift"
).split(" ");

export async function idGenRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: { size?: number; alphabet?: string } }>(
    "/v1/nanoid",
    {
      schema: {
        summary: "Generate URL-safe NanoIDs",
        tags: ["generators"],
        body: {
          type: "object",
          properties: {
            size: { type: "integer", minimum: 2, maximum: 256, default: 21 },
            alphabet: { type: "string", minLength: 2, maxLength: 256 },
          },
        },
      },
    },
    async (req) => {
      const size = req.body.size ?? 21;
      const alphabet = req.body.alphabet ?? NANO_ALPHABET;
      return { id: nanoid(size, alphabet), size };
    },
  );

  app.post<{ Body: { count?: number } }>(
    "/v1/ulid",
    {
      schema: {
        summary: "Generate ULIDs (lexicographically sortable IDs)",
        tags: ["generators"],
        body: {
          type: "object",
          properties: { count: { type: "integer", minimum: 1, maximum: 1000, default: 1 } },
        },
      },
    },
    async (req) => {
      const count = req.body.count ?? 1;
      return { ids: Array.from({ length: count }, () => ulid()) };
    },
  );

  app.post<{ Body: { words?: number; separator?: string; capitalize?: boolean } }>(
    "/v1/passphrase",
    {
      schema: {
        summary: "Generate a memorable passphrase",
        tags: ["generators", "validation"],
        body: {
          type: "object",
          properties: {
            words: { type: "integer", minimum: 2, maximum: 12, default: 4 },
            separator: { type: "string", maxLength: 4, default: "-" },
            capitalize: { type: "boolean", default: false },
          },
        },
      },
    },
    async (req) => {
      const words = req.body.words ?? 4;
      const separator = req.body.separator ?? "-";
      const capitalize = req.body.capitalize ?? false;
      const picked = Array.from({ length: words }, () => {
        const w = WORDS[randomInt(WORDS.length)];
        return capitalize ? w[0].toUpperCase() + w.slice(1) : w;
      });
      return { passphrase: picked.join(separator), words };
    },
  );
}
