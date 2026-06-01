import type { FastifyInstance } from "fastify";
import yaml from "js-yaml";
import { csvToJson, jsonToCsv } from "../lib/csv.js";

type Format = "json" | "yaml" | "csv";

interface ConvertBody {
  from: Format;
  to: Format;
  data: string;
  delimiter?: string;
}

const schema = {
  summary: "Convert data between JSON, YAML and CSV",
  description:
    "Lossless-ish conversion between JSON, YAML and CSV. CSV conversions operate on an array of flat objects. No AI cost.",
  tags: ["data"],
  body: {
    type: "object",
    required: ["from", "to", "data"],
    properties: {
      from: { type: "string", enum: ["json", "yaml", "csv"] },
      to: { type: "string", enum: ["json", "yaml", "csv"] },
      data: { type: "string", maxLength: 1_000_000 },
      delimiter: { type: "string", maxLength: 1, default: "," },
    },
  },
};

function parse(from: Format, data: string, delimiter: string): unknown {
  switch (from) {
    case "json":
      return JSON.parse(data);
    case "yaml":
      return yaml.load(data);
    case "csv":
      return csvToJson(data, delimiter);
  }
}

function serialize(to: Format, value: unknown, delimiter: string): { body: string; contentType: string } {
  switch (to) {
    case "json":
      return { body: JSON.stringify(value, null, 2), contentType: "application/json" };
    case "yaml":
      return { body: yaml.dump(value), contentType: "application/x-yaml" };
    case "csv":
      return { body: jsonToCsv(value, delimiter), contentType: "text/csv" };
  }
}

export async function convertRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: ConvertBody }>("/v1/convert", { schema }, async (req, reply) => {
    const { from, to, data, delimiter = "," } = req.body;
    try {
      const parsed = parse(from, data, delimiter);
      const { body, contentType } = serialize(to, parsed, delimiter);
      return reply.header("content-type", contentType).send(body);
    } catch (err) {
      return reply.code(422).send({
        error: "conversion_failed",
        message: err instanceof Error ? err.message : "Could not convert the supplied data",
      });
    }
  });
}
