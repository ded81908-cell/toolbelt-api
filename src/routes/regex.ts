import type { FastifyInstance } from "fastify";

export async function regexRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: { pattern: string; text: string; flags?: string } }>(
    "/v1/regex/test",
    {
      schema: {
        summary: "Test a regular expression against text",
        description: "Returns whether it matches plus all matches with capture groups. Flags limited to g,i,m,s,u,y.",
        tags: ["text"],
        body: {
          type: "object",
          required: ["pattern", "text"],
          properties: {
            pattern: { type: "string", maxLength: 2000 },
            text: { type: "string", maxLength: 100_000 },
            flags: { type: "string", maxLength: 8, pattern: "^[gimsuy]*$" },
          },
        },
      },
    },
    async (req, reply) => {
      const { pattern, text, flags = "" } = req.body;
      let re: RegExp;
      try {
        re = new RegExp(pattern, flags);
      } catch (e) {
        return reply.code(422).send({ error: "invalid_regex", message: e instanceof Error ? e.message : "Invalid pattern." });
      }
      const matches: { match: string; index: number; groups: (string | undefined)[]; named?: Record<string, string> }[] = [];
      const global = flags.includes("g");
      if (global) {
        let m: RegExpExecArray | null;
        let guard = 0;
        while ((m = re.exec(text)) !== null && guard++ < 10000) {
          matches.push({ match: m[0], index: m.index, groups: m.slice(1), named: m.groups });
          if (m.index === re.lastIndex) re.lastIndex++; // avoid zero-width loop
        }
      } else {
        const m = re.exec(text);
        if (m) matches.push({ match: m[0], index: m.index, groups: m.slice(1), named: m.groups });
      }
      return { matched: matches.length > 0, count: matches.length, matches };
    },
  );
}
