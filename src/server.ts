import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import Fastify, { type FastifyInstance } from "fastify";
import rateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { authenticate } from "./auth.js";
import { loadConfig, type Config } from "./config.js";
import { meter } from "./usage.js";
import { qrRoutes } from "./routes/qr.js";
import { ogImageRoutes } from "./routes/ogimage.js";
import { convertRoutes } from "./routes/convert.js";
import { hashRoutes } from "./routes/hash.js";
import { generateRoutes } from "./routes/generate.js";
import { metaRoutes } from "./routes/meta.js";
import { jpRoutes } from "./routes/jp.js";
import { bulkRoutes } from "./routes/bulk.js";
import { barcodeRoutes } from "./routes/barcode.js";
import { invoiceRoutes } from "./routes/invoice.js";
import { intlRoutes } from "./routes/intl.js";
import { currencyRoutes } from "./routes/currency.js";
import { markdownRoutes } from "./routes/markdown.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

declare module "fastify" {
  interface FastifyContextConfig {
    public?: boolean;
  }
}

export async function buildServer(config: Config = loadConfig()): Promise<FastifyInstance> {
  const app = Fastify({
    logger: { level: process.env.LOG_LEVEL ?? "info" },
    bodyLimit: 2 * 1024 * 1024,
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: "Toolbelt API",
        description:
          "Pay-as-you-go developer utilities: QR codes, social/OG images, data conversion, hashing/encoding and generators. Zero AI cost.",
        version: "1.0.0",
      },
      components: {
        securitySchemes: {
          apiKey: { type: "apiKey", name: "X-API-Key", in: "header" },
        },
      },
      security: [{ apiKey: [] }],
    },
  });
  await app.register(swaggerUi, { routePrefix: "/docs" });

  // Per-client, tier-aware rate limiting.
  await app.register(rateLimit, {
    global: true,
    keyGenerator: (req) => req.clientId ?? req.ip,
    max: (req) => config.rateLimits[req.tier ?? "free"] ?? config.rateLimits.free,
    timeWindow: "1 minute",
    allowList: (req) => req.routeOptions?.config?.public === true,
  });

  // Authentication runs before rate limiting needs req.tier; onRequest is fine
  // because rate-limit also hooks onRequest but is registered after this.
  app.addHook("onRequest", async (req, reply) => {
    if (req.routeOptions?.config?.public === true) return;
    if (req.method === "GET" && (req.url === "/" || req.url.startsWith("/docs"))) return;
    authenticate(config, req, reply);
  });

  // Meter successful, authenticated billable calls.
  app.addHook("onResponse", async (req) => {
    if (!req.clientId) return;
    if (req.routeOptions?.config?.public === true) return;
    if (!req.url.startsWith("/v1/")) return;
    if (req.url.startsWith("/v1/usage")) return;
    meter.record(req.clientId, req.routeOptions?.url ?? req.url);
  });

  await app.register(fastifyStatic, {
    root: join(__dirname, "..", "public"),
    prefix: "/",
    decorateReply: true,
  });

  await app.register(metaRoutes);
  await app.register(qrRoutes);
  await app.register(ogImageRoutes);
  await app.register(convertRoutes);
  await app.register(hashRoutes);
  await app.register(generateRoutes);
  await app.register(jpRoutes);
  await app.register(bulkRoutes);
  await app.register(barcodeRoutes);
  await app.register(invoiceRoutes);
  await app.register(intlRoutes);
  await app.register(currencyRoutes);
  await app.register(markdownRoutes);

  return app;
}
