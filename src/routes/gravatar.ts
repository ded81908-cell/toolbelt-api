import { createHash } from "node:crypto";
import type { FastifyInstance } from "fastify";

export async function gravatarRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: { email: string; size?: number; default?: string } }>(
    "/v1/gravatar",
    {
      schema: {
        summary: "Build a Gravatar avatar URL from an email",
        description: "Returns the Gravatar URL and the email hash. The email is hashed locally; it is never stored or sent anywhere.",
        tags: ["images"],
        body: {
          type: "object",
          required: ["email"],
          properties: {
            email: { type: "string", maxLength: 320 },
            size: { type: "integer", minimum: 1, maximum: 2048, default: 200 },
            default: {
              type: "string",
              enum: ["404", "mp", "identicon", "monsterid", "wavatar", "retro", "robohash", "blank"],
              default: "identicon",
            },
          },
        },
      },
    },
    async (req) => {
      const { email, size = 200, default: def = "identicon" } = req.body;
      const hash = createHash("md5").update(email.trim().toLowerCase()).digest("hex");
      return {
        hash,
        url: `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${def}`,
      };
    },
  );
}
