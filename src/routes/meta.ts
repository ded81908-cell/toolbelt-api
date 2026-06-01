import type { FastifyInstance } from "fastify";
import { meter } from "../usage.js";

/**
 * Operational + account endpoints. `/health` is unauthenticated (for load
 * balancers); `/v1/usage` is authenticated and reports the caller's own usage.
 */
export async function metaRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/health",
    { schema: { summary: "Liveness check", tags: ["meta"] }, config: { public: true } },
    async () => ({ status: "ok", uptime: process.uptime() }),
  );

  app.get(
    "/v1/usage",
    { schema: { summary: "Report the calling client's usage counters", tags: ["meta"] } },
    async (req) => {
      return { clientId: req.clientId, tier: req.tier, ...meter.forClient(req.clientId) };
    },
  );
}
