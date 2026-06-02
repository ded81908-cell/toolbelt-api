import type { FastifyInstance } from "fastify";
import { UAParser } from "ua-parser-js";

export async function userAgentRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: { userAgent: string } }>(
    "/v1/useragent/parse",
    {
      schema: {
        summary: "Parse a User-Agent string",
        description: "Extracts browser, engine, OS, device and CPU from a User-Agent header.",
        tags: ["network"],
        body: {
          type: "object",
          required: ["userAgent"],
          properties: { userAgent: { type: "string", maxLength: 2000 } },
        },
      },
    },
    async (req) => {
      const r = new UAParser(req.body.userAgent).getResult();
      return {
        browser: { name: r.browser.name ?? null, version: r.browser.version ?? null },
        engine: { name: r.engine.name ?? null, version: r.engine.version ?? null },
        os: { name: r.os.name ?? null, version: r.os.version ?? null },
        device: { type: r.device.type ?? "desktop", vendor: r.device.vendor ?? null, model: r.device.model ?? null },
        cpu: { architecture: r.cpu.architecture ?? null },
      };
    },
  );
}
