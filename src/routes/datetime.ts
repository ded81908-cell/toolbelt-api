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

  app.post<{ Body: { from: string | number; to?: string | number } }>(
    "/v1/time/diff",
    {
      schema: {
        summary: "Humanized difference between two timestamps",
        description: "Each value may be a Unix timestamp (seconds) or ISO-8601 string. `to` defaults to now.",
        tags: ["datetime"],
        body: {
          type: "object",
          required: ["from"],
          properties: { from: { type: ["string", "number"] }, to: { type: ["string", "number"] } },
        },
      },
    },
    async (req, reply) => {
      const parse = (v: string | number | undefined): Date => {
        if (v === undefined || v === "") return new Date();
        if (typeof v === "number") return new Date(v * 1000);
        return /^\d+$/.test(v) ? new Date(Number(v) * 1000) : new Date(v);
      };
      const from = parse(req.body.from);
      const to = parse(req.body.to);
      if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
        return reply.code(422).send({ error: "invalid_input", message: "Could not parse one of the timestamps." });
      }
      const ms = to.getTime() - from.getTime();
      const abs = Math.abs(ms);
      const units: [string, number][] = [
        ["year", 31536000000], ["day", 86400000], ["hour", 3600000], ["minute", 60000], ["second", 1000],
      ];
      const parts: string[] = [];
      let rem = abs;
      for (const [name, size] of units) {
        const n = Math.floor(rem / size);
        if (n > 0) { parts.push(`${n} ${name}${n === 1 ? "" : "s"}`); rem -= n * size; }
      }
      const humanized = parts.length ? parts.slice(0, 2).join(", ") + (ms < 0 ? " ago" : "") : "0 seconds";
      return {
        milliseconds: ms,
        seconds: Math.round(ms / 1000),
        days: Math.round((ms / 86400000) * 100) / 100,
        humanized,
      };
    },
  );
}
