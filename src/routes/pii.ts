import type { FastifyInstance } from "fastify";

export async function piiRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: { text: string } }>(
    "/v1/pii/redact",
    {
      schema: {
        summary: "Redact PII (emails, phones, card numbers) from text",
        description: "Masks emails, long digit sequences (card-like) and phone numbers in free text. Useful before logging or sharing.",
        tags: ["text", "validation"],
        body: { type: "object", required: ["text"], properties: { text: { type: "string", maxLength: 500_000 } } },
      },
    },
    async (req) => {
      let text = req.body.text;
      const counts = { emails: 0, cards: 0, phones: 0 };

      // Emails: keep first char of local part + domain.
      text = text.replace(/([A-Za-z0-9._%+-])[A-Za-z0-9._%+-]*(@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g, (_m, first: string, domain: string) => {
        counts.emails++;
        return `${first}***${domain}`;
      });

      // Card-like: 13–16 digits (optionally space/dash separated) -> keep last 4.
      text = text.replace(/\b(?:\d[ -]?){12,15}\d\b/g, (m) => {
        const digits = m.replace(/[ -]/g, "");
        if (digits.length < 13 || digits.length > 16) return m;
        counts.cards++;
        return "•".repeat(digits.length - 4) + digits.slice(-4);
      });

      // Phone-like: + and 8–14 digits with separators -> mask middle.
      text = text.replace(/\+?\d[\d\s().-]{7,}\d/g, (m) => {
        const digits = m.replace(/\D/g, "");
        if (digits.length < 8 || digits.length > 15) return m;
        counts.phones++;
        return digits.slice(0, 2) + "•".repeat(Math.max(digits.length - 4, 0)) + digits.slice(-2);
      });

      return { redacted: text, counts };
    },
  );
}
