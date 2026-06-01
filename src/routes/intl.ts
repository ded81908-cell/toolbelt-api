import type { FastifyInstance } from "fastify";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { intlSlug, transliterate } from "../lib/translit.js";

interface TranslitBody {
  text: string;
}

interface PhoneBody {
  number: string;
  country?: string;
}

interface PostalBody {
  code: string;
  country: string;
}

// Lightweight, dependency-free postal-code rules for high-traffic countries.
// Each entry: a normaliser (strip + uppercase) and a validating/formatting regex.
const POSTAL: Record<string, { format: (raw: string) => string | null }> = {
  JP: {
    format: (raw) => {
      const d = raw.replace(/\D/g, "");
      return d.length === 7 ? `${d.slice(0, 3)}-${d.slice(3)}` : null;
    },
  },
  US: {
    format: (raw) => {
      const d = raw.replace(/\D/g, "");
      if (d.length === 5) return d;
      if (d.length === 9) return `${d.slice(0, 5)}-${d.slice(5)}`;
      return null;
    },
  },
  CA: {
    format: (raw) => {
      const s = raw.toUpperCase().replace(/\s+/g, "");
      return /^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(s) ? `${s.slice(0, 3)} ${s.slice(3)}` : null;
    },
  },
  GB: {
    format: (raw) => {
      const s = raw.toUpperCase().replace(/\s+/g, "");
      return /^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(s)
        ? `${s.slice(0, s.length - 3)} ${s.slice(-3)}`
        : null;
    },
  },
  DE: { format: (raw) => (/^\d{5}$/.test(raw.trim()) ? raw.trim() : null) },
  FR: { format: (raw) => (/^\d{5}$/.test(raw.trim()) ? raw.trim() : null) },
};

export async function intlRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: TranslitBody }>(
    "/v1/translit",
    {
      schema: {
        summary: "Transliterate text to Latin (ASCII-friendly)",
        description:
          "Removes diacritics and romanises Cyrillic/Greek. café→cafe, Москва→Moskva, Ελλάδα→Ellada.",
        tags: ["intl", "text"],
        body: {
          type: "object",
          required: ["text"],
          properties: { text: { type: "string", maxLength: 100_000 } },
        },
      },
    },
    async (req) => ({ result: transliterate(req.body.text) }),
  );

  app.post<{ Body: TranslitBody }>(
    "/v1/slug/intl",
    {
      schema: {
        summary: "URL slug from any-language text (transliterated)",
        description: "Transliterates then slugifies — works for accented Latin, Cyrillic and Greek.",
        tags: ["intl", "text"],
        body: {
          type: "object",
          required: ["text"],
          properties: { text: { type: "string", maxLength: 2000 } },
        },
      },
    },
    async (req) => ({ slug: intlSlug(req.body.text) }),
  );

  app.post<{ Body: PhoneBody }>(
    "/v1/phone",
    {
      schema: {
        summary: "Parse, validate and format a phone number",
        description:
          "Country-aware phone handling via libphonenumber. Returns E.164, national and international formats, validity, type and region.",
        tags: ["intl"],
        body: {
          type: "object",
          required: ["number"],
          properties: {
            number: { type: "string", maxLength: 40 },
            country: { type: "string", minLength: 2, maxLength: 2 },
          },
        },
      },
    },
    async (req) => {
      const { number, country } = req.body;
      const parsed = parsePhoneNumberFromString(
        number,
        country ? (country.toUpperCase() as never) : undefined,
      );
      if (!parsed) {
        return { valid: false, input: number };
      }
      return {
        valid: parsed.isValid(),
        input: number,
        e164: parsed.number,
        national: parsed.formatNational(),
        international: parsed.formatInternational(),
        country: parsed.country ?? null,
        countryCallingCode: parsed.countryCallingCode,
        type: parsed.getType() ?? null,
      };
    },
  );

  app.post<{ Body: PostalBody }>(
    "/v1/postal",
    {
      schema: {
        summary: "Validate and normalise a postal code",
        description:
          "Country-aware postal-code formatting (JP 123-4567, US ZIP+4, CA A1A 1A1, GB, DE, FR).",
        tags: ["intl"],
        body: {
          type: "object",
          required: ["code", "country"],
          properties: {
            code: { type: "string", maxLength: 16 },
            country: { type: "string", minLength: 2, maxLength: 2 },
          },
        },
      },
    },
    async (req, reply) => {
      const country = req.body.country.toUpperCase();
      const rule = POSTAL[country];
      if (!rule) {
        return reply.code(422).send({
          error: "unsupported_country",
          message: `Postal formatting not available for ${country}. Supported: ${Object.keys(POSTAL).join(", ")}.`,
        });
      }
      const formatted = rule.format(req.body.code);
      return { country, valid: formatted !== null, formatted };
    },
  );
}
