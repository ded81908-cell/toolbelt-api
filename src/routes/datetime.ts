import type { FastifyInstance } from "fastify";

interface TimeBody {
  input?: string | number;
  timezone?: string;
  locale?: string;
}

export async function datetimeRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: TimeBody }>(
    "/v1/time/convert",
    {
      schema: {
        summary: "Convert/format a timestamp across timezones",
        description:
          "Accepts a Unix timestamp (seconds) or an ISO-8601 string (defaults to now). Returns Unix, ISO and a localized string in the given IANA timezone.",
        tags: ["datetime"],
        body: {
          type: "object",
          properties: {
            input: { type: ["string", "number"] },
            timezone: { type: "string", maxLength: 64, default: "UTC" },
            locale: { type: "string", maxLength: 16, default: "en-US" },
          },
        },
      },
    },
    async (req, reply) => {
      const { input, timezone = "UTC", locale = "en-US" } = req.body;
      let date: Date;
      if (input === undefined || input === "") {
        date = new Date();
      } else if (typeof input === "number") {
        date = new Date(input * 1000);
      } else if (/^\d+$/.test(input)) {
        date = new Date(Number(input) * 1000);
      } else {
        date = new Date(input);
      }
      if (Number.isNaN(date.getTime())) {
        return reply.code(422).send({ error: "invalid_input", message: "Could not parse the timestamp." });
      }

      let formatted: string;
      try {
        formatted = new Intl.DateTimeFormat(locale, {
          dateStyle: "full",
          timeStyle: "long",
          timeZone: timezone,
        }).format(date);
      } catch {
        return reply.code(422).send({ error: "invalid_timezone", message: `Unknown timezone: ${timezone}` });
      }

      return {
        unix: Math.floor(date.getTime() / 1000),
        unixMs: date.getTime(),
        iso: date.toISOString(),
        timezone,
        formatted,
        weekday: new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: timezone }).format(date),
      };
    },
  );
}
