import type { FastifyReply, FastifyRequest } from "fastify";
import type { Config, Tier } from "./config.js";

declare module "fastify" {
  interface FastifyRequest {
    tier: Tier;
    clientId: string;
  }
}

/**
 * Authenticates a request. Three accepted paths, in priority order:
 *  1. RapidAPI gateway: trusted when the forwarded proxy secret matches. Billing
 *     and key management are handled by RapidAPI, so we map these to the "pro" tier.
 *  2. Direct API key via `X-API-Key` header, looked up in the configured key store.
 *  3. Anonymous access, only when ALLOW_ANONYMOUS=true (local/dev).
 *
 * On success it annotates the request with `tier` and `clientId`. On failure it
 * sends a 401 and returns false.
 */
export function authenticate(
  config: Config,
  req: FastifyRequest,
  reply: FastifyReply,
): boolean {
  // 1. RapidAPI gateway
  if (config.rapidApiProxySecret) {
    const proxySecret = req.headers["x-rapidapi-proxy-secret"];
    if (typeof proxySecret === "string" && proxySecret === config.rapidApiProxySecret) {
      const user = req.headers["x-rapidapi-user"];
      req.tier = "pro";
      req.clientId = `rapidapi:${typeof user === "string" ? user : "unknown"}`;
      return true;
    }
  }

  // 2. Direct API key
  const apiKey = req.headers["x-api-key"];
  if (typeof apiKey === "string" && config.apiKeys.has(apiKey)) {
    const record = config.apiKeys.get(apiKey)!;
    req.tier = record.tier;
    req.clientId = `key:${apiKey.slice(0, 6)}…`;
    return true;
  }

  // 3. Anonymous (dev only)
  if (config.allowAnonymous) {
    req.tier = "free";
    req.clientId = "anonymous";
    return true;
  }

  reply.code(401).send({
    error: "unauthorized",
    message:
      "Missing or invalid credentials. Provide a valid X-API-Key header, or access via RapidAPI.",
  });
  return false;
}
