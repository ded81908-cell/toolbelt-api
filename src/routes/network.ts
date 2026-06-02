import type { FastifyInstance } from "fastify";

function ipToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const v = Number(p);
    if (v > 255) return null;
    n = (n << 8) | v;
  }
  return n >>> 0;
}

function intToIp(n: number): string {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
}

function classifyIpv4(ip: string): string {
  const o = ip.split(".").map(Number);
  if (o[0] === 10 || (o[0] === 172 && o[1] >= 16 && o[1] <= 31) || (o[0] === 192 && o[1] === 168)) return "private";
  if (o[0] === 127) return "loopback";
  if (o[0] === 169 && o[1] === 254) return "link-local";
  if (o[0] >= 224 && o[0] <= 239) return "multicast";
  return "public";
}

export async function networkRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: { ip: string } }>(
    "/v1/ip/info",
    {
      schema: {
        summary: "Validate and classify an IP address (v4/v6)",
        tags: ["network"],
        body: { type: "object", required: ["ip"], properties: { ip: { type: "string", maxLength: 64 } } },
      },
    },
    async (req) => {
      const ip = req.body.ip.trim();
      const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ip);
      if (v4 && v4.slice(1).every((p) => Number(p) <= 255)) {
        return { valid: true, version: 4, type: classifyIpv4(ip) };
      }
      const v6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|::([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4})$/;
      if (v6.test(ip) || ip === "::1" || ip === "::") {
        const type = ip === "::1" ? "loopback" : ip.toLowerCase().startsWith("fe80") ? "link-local" : ip.toLowerCase().startsWith("fc") || ip.toLowerCase().startsWith("fd") ? "private" : "public";
        return { valid: true, version: 6, type };
      }
      return { valid: false, version: null, type: null };
    },
  );

  app.post<{ Body: { cidr: string } }>(
    "/v1/cidr",
    {
      schema: {
        summary: "IPv4 subnet / CIDR calculator",
        description: "Given a CIDR (e.g. 192.168.1.0/24), returns network, broadcast, netmask, host range and counts.",
        tags: ["network"],
        body: { type: "object", required: ["cidr"], properties: { cidr: { type: "string", maxLength: 32 } } },
      },
    },
    async (req, reply) => {
      const m = /^(\d{1,3}(?:\.\d{1,3}){3})\/(\d{1,2})$/.exec(req.body.cidr.trim());
      if (!m) return reply.code(422).send({ error: "invalid_cidr", message: "Use the form a.b.c.d/n (n = 0–32)." });
      const ipInt = ipToInt(m[1]);
      const prefix = Number(m[2]);
      if (ipInt === null || prefix > 32) return reply.code(422).send({ error: "invalid_cidr", message: "Invalid IP or prefix." });

      const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
      const network = (ipInt & mask) >>> 0;
      const broadcast = (network | (~mask >>> 0)) >>> 0;
      const total = 2 ** (32 - prefix);
      const usable = prefix >= 31 ? (prefix === 32 ? 1 : 2) : total - 2;
      const firstHost = prefix >= 31 ? network : (network + 1) >>> 0;
      const lastHost = prefix >= 31 ? broadcast : (broadcast - 1) >>> 0;

      return {
        cidr: req.body.cidr.trim(),
        network: intToIp(network),
        broadcast: intToIp(broadcast),
        netmask: intToIp(mask),
        wildcard: intToIp(~mask >>> 0),
        prefix,
        firstHost: intToIp(firstHost),
        lastHost: intToIp(lastHost),
        totalAddresses: total,
        usableHosts: usable,
      };
    },
  );
}
