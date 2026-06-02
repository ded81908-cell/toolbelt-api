import type { FastifyInstance } from "fastify";

interface JsonBody {
  json: string;
  indent?: number;
  sortKeys?: boolean;
}

function sortDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(value as Record<string, unknown>).sort()) {
      out[k] = sortDeep((value as Record<string, unknown>)[k]);
    }
    return out;
  }
  return value;
}

export async function jsonRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: JsonBody }>(
    "/v1/json/format",
    {
      schema: {
        summary: "Validate, pretty-print or minify JSON",
        description: "Parses a JSON string and returns both a formatted (indent) and minified version. indent:0 minifies. Optionally sorts object keys.",
        tags: ["data"],
        body: {
          type: "object",
          required: ["json"],
          properties: {
            json: { type: "string", maxLength: 1_000_000 },
            indent: { type: "integer", minimum: 0, maximum: 8, default: 2 },
            sortKeys: { type: "boolean", default: false },
          },
        },
      },
    },
    async (req, reply) => {
      const { json, indent = 2, sortKeys = false } = req.body;
      let parsed: unknown;
      try {
        parsed = JSON.parse(json);
      } catch (e) {
        return reply.code(422).send({ valid: false, error: "invalid_json", message: e instanceof Error ? e.message : "Invalid JSON." });
      }
      const value = sortKeys ? sortDeep(parsed) : parsed;
      return {
        valid: true,
        formatted: JSON.stringify(value, null, indent),
        minified: JSON.stringify(value),
      };
    },
  );
}
