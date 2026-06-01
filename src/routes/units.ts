import type { FastifyInstance } from "fastify";

// Factors relative to a base unit per category.
const FACTORS: Record<string, Record<string, number>> = {
  length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, yd: 0.9144, ft: 0.3048, in: 0.0254, nmi: 1852 },
  mass: { g: 1, kg: 1000, mg: 0.001, t: 1e6, lb: 453.59237, oz: 28.349523125 },
  data: { b: 1, kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3, tb: 1024 ** 4, pb: 1024 ** 5 },
  time: { s: 1, ms: 0.001, min: 60, h: 3600, d: 86400, wk: 604800 },
  speed: { "m/s": 1, "km/h": 1000 / 3600, mph: 1609.344 / 3600, kn: 1852 / 3600 },
  area: { "m2": 1, "km2": 1e6, "cm2": 1e-4, ha: 1e4, acre: 4046.8564224, "ft2": 0.09290304 },
  volume: { l: 1, ml: 0.001, "m3": 1000, gal: 3.785411784, qt: 0.946352946, cup: 0.2365882365 },
};

function findCategory(from: string, to: string): string | null {
  for (const [cat, units] of Object.entries(FACTORS)) {
    if (from in units && to in units) return cat;
  }
  return null;
}

function convertTemp(value: number, from: string, to: string): number | null {
  const f = from.toLowerCase(), t = to.toLowerCase();
  const temps = ["c", "f", "k"];
  if (!temps.includes(f) || !temps.includes(t)) return null;
  let celsius: number;
  if (f === "c") celsius = value;
  else if (f === "f") celsius = (value - 32) * (5 / 9);
  else celsius = value - 273.15;
  if (t === "c") return celsius;
  if (t === "f") return celsius * (9 / 5) + 32;
  return celsius + 273.15;
}

export async function unitsRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: { value: number; from: string; to: string } }>(
    "/v1/units/convert",
    {
      schema: {
        summary: "Convert between units (length, mass, data, temperature, …)",
        description:
          "Categories: length, mass, data, time, speed, area, volume, temperature (c/f/k). Units must belong to the same category.",
        tags: ["units"],
        body: {
          type: "object",
          required: ["value", "from", "to"],
          properties: {
            value: { type: "number" },
            from: { type: "string", maxLength: 16 },
            to: { type: "string", maxLength: 16 },
          },
        },
      },
    },
    async (req, reply) => {
      const { value, from, to } = req.body;

      const temp = convertTemp(value, from, to);
      if (temp !== null) {
        return { value, from, to, category: "temperature", result: Math.round(temp * 1e6) / 1e6 };
      }

      const cat = findCategory(from, to);
      if (!cat) {
        return reply.code(422).send({
          error: "incompatible_units",
          message: `Cannot convert ${from} -> ${to}. Units must be in the same category.`,
        });
      }
      const result = (value * FACTORS[cat][from]) / FACTORS[cat][to];
      return { value, from, to, category: cat, result: Math.round(result * 1e9) / 1e9 };
    },
  );
}
