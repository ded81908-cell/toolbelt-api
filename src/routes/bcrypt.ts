import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";

export async function bcryptRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: { password: string; rounds?: number } }>(
    "/v1/bcrypt/hash",
    {
      schema: {
        summary: "Hash a password with bcrypt",
        description: "Returns a salted bcrypt hash. Cost (rounds) defaults to 10. bcrypt truncates input at 72 bytes.",
        tags: ["crypto"],
        body: {
          type: "object",
          required: ["password"],
          properties: {
            password: { type: "string", maxLength: 200 },
            rounds: { type: "integer", minimum: 4, maximum: 13, default: 10 },
          },
        },
      },
    },
    async (req) => {
      const { password, rounds = 10 } = req.body;
      const hash = bcrypt.hashSync(password, rounds);
      return { hash, rounds };
    },
  );

  app.post<{ Body: { password: string; hash: string } }>(
    "/v1/bcrypt/verify",
    {
      schema: {
        summary: "Verify a password against a bcrypt hash",
        tags: ["crypto"],
        body: {
          type: "object",
          required: ["password", "hash"],
          properties: {
            password: { type: "string", maxLength: 200 },
            hash: { type: "string", maxLength: 200 },
          },
        },
      },
    },
    async (req) => {
      let match = false;
      try {
        match = bcrypt.compareSync(req.body.password, req.body.hash);
      } catch {
        match = false;
      }
      return { match };
    },
  );
}
