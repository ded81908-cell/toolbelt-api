import type { FastifyInstance } from "fastify";

interface Point { lat: number; lon: number; }

interface GeoBody {
  from: Point;
  to: Point;
  unit?: "km" | "mi" | "m";
}

const pointSchema = {
  type: "object",
  required: ["lat", "lon"],
  properties: {
    lat: { type: "number", minimum: -90, maximum: 90 },
    lon: { type: "number", minimum: -180, maximum: 180 },
  },
};

export async function geoRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: GeoBody }>(
    "/v1/geo/distance",
    {
      schema: {
        summary: "Great-circle distance between two coordinates (Haversine)",
        tags: ["geo"],
        body: {
          type: "object",
          required: ["from", "to"],
          properties: {
            from: pointSchema,
            to: pointSchema,
            unit: { type: "string", enum: ["km", "mi", "m"], default: "km" },
          },
        },
      },
    },
    async (req) => {
      const { from, to, unit = "km" } = req.body;
      const R = 6371000; // metres
      const toRad = (d: number): number => (d * Math.PI) / 180;
      const dLat = toRad(to.lat - from.lat);
      const dLon = toRad(to.lon - from.lon);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLon / 2) ** 2;
      const metres = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const value = unit === "km" ? metres / 1000 : unit === "mi" ? metres / 1609.344 : metres;
      return { distance: Math.round(value * 1000) / 1000, unit };
    },
  );
}
