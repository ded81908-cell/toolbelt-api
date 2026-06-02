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

export async function networkRoutes(app: FastifyInstance): Promise<void> {
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
