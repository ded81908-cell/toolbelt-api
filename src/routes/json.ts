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

function diffValues(a: unknown, b: unknown, path: string, out: { added: Record<string, unknown>; removed: Record<string, unknown>; changed: Record<string, { from: unknown; to: unknown }> }): void {
  const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
  if (isObj(a) && isObj(b)) {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      const p = path ? `${path}.${k}` : k;
      if (!(k in a)) out.added[p] = b[k];
      else if (!(k in b)) out.removed[p] = a[k];
      else diffValues(a[k], b[k], p, out);
    }
  } else if (JSON.stringify(a) !== JSON.stringify(b)) {
    out.changed[path || "(root)"] = { from: a, to: b };
  }
}

function getPath(obj: unknown, path: string): unknown {
  const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean);
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur && typeof cur === "object") cur = (cur as Record<string, unknown>)[p];
    else return undefined;
  }
  return cur;
}

export async function jsonRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: { a: unknown; b: unknown } }>(
    "/v1/json/diff",
    {
      schema: {
        summary: "Diff two JSON values",
        description: "Returns added, removed and changed paths between two JSON objects/values.",
        tags: ["data"],
        body: {
          type: "object",
          required: ["a", "b"],
          properties: { a: {}, b: {} },
        },
      },
    },
    async (req) => {
      const out = { added: {}, removed: {}, changed: {} };
      diffValues(req.body.a, req.body.b, "", out);
      return { ...out, equal: Object.keys(out.added).length === 0 && Object.keys(out.removed).length === 0 && Object.keys(out.changed).length === 0 };
    },
  );

  app.post<{ Body: { data: unknown; path: string } }>(
    "/v1/json/get",
    {
      schema: {
        summary: "Extract a value from JSON by path",
        description: "Dot/bracket path access, e.g. user.addresses[0].city.",
        tags: ["data"],
        body: {
          type: "object",
          required: ["data", "path"],
          properties: { data: {}, path: { type: "string", maxLength: 1000 } },
        },
      },
    },
    async (req) => {
      const value = getPath(req.body.data, req.body.path);
      return { path: req.body.path, found: value !== undefined, value: value ?? null };
    },
  );

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
