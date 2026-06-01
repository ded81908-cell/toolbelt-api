export type Tier = "free" | "pro" | "ultra";

export interface ApiKeyRecord {
  key: string;
  tier: Tier;
}

export interface Config {
  port: number;
  host: string;
  allowAnonymous: boolean;
  rapidApiProxySecret: string | null;
  apiKeys: Map<string, ApiKeyRecord>;
  rateLimits: Record<Tier, number>;
}

function parseApiKeys(raw: string | undefined): Map<string, ApiKeyRecord> {
  const map = new Map<string, ApiKeyRecord>();
  if (!raw) return map;
  for (const entry of raw.split(",")) {
    const trimmed = entry.trim();
    if (!trimmed) continue;
    const [key, tierRaw] = trimmed.split(":");
    const tier = (tierRaw?.trim() as Tier) || "free";
    if (!key) continue;
    map.set(key.trim(), { key: key.trim(), tier });
  }
  return map;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return {
    port: Number(env.PORT ?? 3000),
    host: env.HOST ?? "0.0.0.0",
    allowAnonymous: env.ALLOW_ANONYMOUS === "true",
    rapidApiProxySecret: env.RAPIDAPI_PROXY_SECRET?.trim() || null,
    apiKeys: parseApiKeys(env.API_KEYS),
    rateLimits: {
      free: Number(env.RATE_LIMIT_FREE ?? 30),
      pro: Number(env.RATE_LIMIT_PRO ?? 300),
      ultra: Number(env.RATE_LIMIT_ULTRA ?? 3000),
    },
  };
}
