import type { FastifyInstance } from "fastify";

export async function urlRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: { url: string } }>(
    "/v1/url/parse",
    {
      schema: {
        summary: "Parse a URL into its components",
        tags: ["url"],
        body: { type: "object", required: ["url"], properties: { url: { type: "string", maxLength: 4096 } } },
      },
    },
    async (req, reply) => {
      try {
        const u = new URL(req.body.url);
        const query: Record<string, string> = {};
        for (const [k, v] of u.searchParams) query[k] = v;
        return {
          href: u.href,
          protocol: u.protocol.replace(/:$/, ""),
          origin: u.origin,
          username: u.username || null,
          password: u.password || null,
          hostname: u.hostname,
          port: u.port || null,
          pathname: u.pathname,
          search: u.search || null,
          hash: u.hash || null,
          query,
        };
      } catch {
        return reply.code(422).send({ error: "invalid_url", message: "Could not parse the URL (include a scheme, e.g. https://)." });
      }
    },
  );

  app.post<{ Body: { action: "parse" | "build"; value: string | Record<string, string | number | boolean> } }>(
    "/v1/url/query",
    {
      schema: {
        summary: "Parse or build a URL query string",
        description: "action=parse: query string → object. action=build: object → query string.",
        tags: ["url"],
        body: {
          type: "object",
          required: ["action", "value"],
          properties: {
            action: { type: "string", enum: ["parse", "build"] },
            value: {},
          },
        },
      },
    },
    async (req, reply) => {
      const { action, value } = req.body;
      if (action === "parse") {
        if (typeof value !== "string") return reply.code(422).send({ error: "bad_value", message: "Expected a string." });
        const params = new URLSearchParams(value.replace(/^\?/, ""));
        const out: Record<string, string> = {};
        for (const [k, v] of params) out[k] = v;
        return { query: out };
      }
      if (typeof value !== "object" || value === null) {
        return reply.code(422).send({ error: "bad_value", message: "Expected an object." });
      }
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(value)) params.set(k, String(v));
      return { queryString: params.toString() };
    },
  );
}
