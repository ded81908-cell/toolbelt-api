import type { FastifyInstance } from "fastify";
import {
  hiraToKata,
  kataToHira,
  romanize,
  toHankaku,
  toZenkaku,
} from "../lib/jp.js";

type JpOperation =
  | "hankaku"
  | "zenkaku"
  | "hiragana"
  | "katakana"
  | "romaji";

interface JpConvertBody {
  text: string;
  operation: JpOperation;
}

interface JpSlugBody {
  text: string;
}

function apply(text: string, operation: JpOperation): string {
  switch (operation) {
    case "hankaku":
      return toHankaku(text);
    case "zenkaku":
      return toZenkaku(text);
    case "hiragana":
      return kataToHira(text);
    case "katakana":
      return hiraToKata(text);
    case "romaji":
      return romanize(text);
  }
}

function romajiSlug(text: string): string {
  return romanize(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

export async function jpRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: JpConvertBody }>(
    "/v1/jp/convert",
    {
      schema: {
        summary: "Japanese text conversion",
        description:
          "Full-width⇄half-width, hiragana⇄katakana, and kana→romaji conversion. Niche, low-competition utilities for Japanese-facing apps.",
        tags: ["japanese"],
        body: {
          type: "object",
          required: ["text", "operation"],
          properties: {
            text: { type: "string", maxLength: 100_000 },
            operation: {
              type: "string",
              enum: ["hankaku", "zenkaku", "hiragana", "katakana", "romaji"],
            },
          },
        },
      },
    },
    async (req) => {
      const { text, operation } = req.body;
      return { operation, result: apply(text, operation) };
    },
  );

  app.post<{ Body: JpSlugBody }>(
    "/v1/jp/slug",
    {
      schema: {
        summary: "Romaji slug from Japanese text",
        description:
          "Romanises Japanese (kana) and slugifies it — e.g. 東京タワー → tokyotawa. Useful for URLs/IDs from Japanese titles.",
        tags: ["japanese"],
        body: {
          type: "object",
          required: ["text"],
          properties: { text: { type: "string", maxLength: 2000 } },
        },
      },
    },
    async (req) => {
      return { slug: romajiSlug(req.body.text) };
    },
  );
}
