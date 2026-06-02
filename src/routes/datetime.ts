import type { FastifyInstance } from "fastify";

interface TimeBody {
  input?: string | number;
  timezone?: string;
  locale?: string;
}

export async function datetimeRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: { date?: string; years?: number; months?: number; days?: number; hours?: number; minutes?: number; seconds?: number } }>(
    "/v1/date/add",
    {
      schema: {
        summary: "Add or subtract a duration from a date",
        description: "Adds the given fields (use negatives to subtract) to `date` (default now). Returns the resulting ISO timestamp.",
        tags: ["datetime"],
        body: {
          type: "object",
          properties: {
            date: { type: "string", maxLength: 40 },
            years: { type: "integer", minimum: -100000, maximum: 100000, default: 0 },
            months: { type: "integer", minimum: -1200000, maximum: 1200000, default: 0 },
            days: { type: "integer", minimum: -3650000, maximum: 3650000, default: 0 },
            hours: { type: "integer", default: 0 },
            minutes: { type: "integer", default: 0 },
            seconds: { type: "integer", default: 0 },
          },
        },
      },
    },
    async (req, reply) => {
      const { date, years = 0, months = 0, days = 0, hours = 0, minutes = 0, seconds = 0 } = req.body;
      const d = date ? new Date(date) : new Date();
      if (Number.isNaN(d.getTime())) return reply.code(422).send({ error: "invalid_date", message: "Could not parse `date`." });
      d.setUTCFullYear(d.getUTCFullYear() + years);
      d.setUTCMonth(d.getUTCMonth() + months);
      d.setUTCDate(d.getUTCDate() + days);
      d.setUTCHours(d.getUTCHours() + hours, d.getUTCMinutes() + minutes, d.getUTCSeconds() + seconds);
      return { iso: d.toISOString(), unix: Math.floor(d.getTime() / 1000) };
    },
  );

  app.post<{ Body: { from: string; to: string } }>(
    "/v1/date/business-days",
    {
      schema: {
        summary: "Count business days (Mon–Fri) between two dates",
        tags: ["datetime"],
        body: {
          type: "object",
          required: ["from", "to"],
          properties: { from: { type: "string", maxLength: 40 }, to: { type: "string", maxLength: 40 } },
        },
      },
    },
    async (req, reply) => {
      const from = new Date(req.body.from);
      const to = new Date(req.body.to);
      if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return reply.code(422).send({ error: "invalid_date", message: "Use ISO dates." });
      const totalDays = Math.round((Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()) - Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())) / 86400000);
      if (Math.abs(totalDays) > 366 * 200) return reply.code(422).send({ error: "range_too_large", message: "Range exceeds 200 years." });
      const step = totalDays >= 0 ? 1 : -1;
      let business = 0;
      const cur = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
      for (let i = 0; i !== totalDays; i += step) {
        const dow = cur.getUTCDay();
        if (dow !== 0 && dow !== 6) business++;
        cur.setUTCDate(cur.getUTCDate() + step);
      }
      return { from: req.body.from, to: req.body.to, calendarDays: Math.abs(totalDays), businessDays: business };
    },
  );

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
            input: { anyOf: [{ type: "string" }, { type: "number" }] },
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

  app.post<{ Body: { birthdate: string; at?: string } }>(
    "/v1/age",
    {
      schema: {
        summary: "Compute age / elapsed time from a date",
        description: "Given a birthdate (ISO date), returns years, months and days elapsed (to `at`, default now).",
        tags: ["datetime"],
        body: {
          type: "object",
          required: ["birthdate"],
          properties: {
            birthdate: { type: "string", maxLength: 32 },
            at: { type: "string", maxLength: 32 },
          },
        },
      },
    },
    async (req, reply) => {
      const from = new Date(req.body.birthdate);
      const to = req.body.at ? new Date(req.body.at) : new Date();
      if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
        return reply.code(422).send({ error: "invalid_date", message: "Use an ISO date like 1990-05-20." });
      }
      if (to < from) return reply.code(422).send({ error: "invalid_range", message: "birthdate is after the target date." });
      let years = to.getUTCFullYear() - from.getUTCFullYear();
      let months = to.getUTCMonth() - from.getUTCMonth();
      let days = to.getUTCDate() - from.getUTCDate();
      if (days < 0) { months--; days += new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), 0)).getUTCDate(); }
      if (months < 0) { years--; months += 12; }
      const totalDays = Math.floor((to.getTime() - from.getTime()) / 86400000);
      return { years, months, days, totalDays };
    },
  );

  app.post<{ Body: { filter?: string } }>(
    "/v1/time/zones",
    {
      schema: {
        summary: "List IANA timezones (optionally filtered)",
        tags: ["datetime"],
        body: {
          type: "object",
          properties: { filter: { type: "string", maxLength: 64 } },
        },
      },
    },
    async (req) => {
      const all = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.("timeZone") ?? [];
      const filter = req.body.filter?.toLowerCase();
      const zones = filter ? all.filter((z) => z.toLowerCase().includes(filter)) : all;
      return { count: zones.length, timezones: zones };
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
          properties: {
            from: { anyOf: [{ type: "string" }, { type: "number" }] },
            to: { anyOf: [{ type: "string" }, { type: "number" }] },
          },
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
