import type { FastifyInstance } from "fastify";

function luhnValid(num: string): boolean {
  let sum = 0, alt = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let d = num.charCodeAt(i) - 48;
    if (d < 0 || d > 9) return false;
    if (alt) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function cardBrand(n: string): string | null {
  if (/^4\d{12}(\d{3})?(\d{3})?$/.test(n)) return "Visa";
  if (/^(5[1-5]\d{14}|2(22[1-9]|2[3-9]\d|[3-6]\d{2}|7[01]\d|720)\d{12})$/.test(n)) return "Mastercard";
  if (/^3[47]\d{13}$/.test(n)) return "American Express";
  if (/^(6011\d{12}|65\d{14}|64[4-9]\d{13})$/.test(n)) return "Discover";
  if (/^35\d{14}$/.test(n)) return "JCB";
  if (/^3(0[0-5]|[68]\d)\d{11}$/.test(n)) return "Diners Club";
  return null;
}

function ibanValid(raw: string): { valid: boolean; formatted: string } {
  const s = raw.replace(/\s+/g, "").toUpperCase();
  const formatted = s.replace(/(.{4})/g, "$1 ").trim();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/.test(s) || s.length < 15 || s.length > 34) {
    return { valid: false, formatted };
  }
  const rearranged = s.slice(4) + s.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  // mod-97 over a long numeric string
  let remainder = 0;
  for (const ch of numeric) remainder = (remainder * 10 + (ch.charCodeAt(0) - 48)) % 97;
  return { valid: remainder === 1, formatted };
}

function passwordStrength(pw: string): {
  score: number; entropyBits: number; crackTime: string; suggestions: string[];
} {
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26;
  if (/[A-Z]/.test(pw)) pool += 26;
  if (/[0-9]/.test(pw)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) pool += 33;
  const entropy = pw.length > 0 && pool > 0 ? pw.length * Math.log2(pool) : 0;
  const bits = Math.round(entropy);

  const guesses = 2 ** entropy / 2;
  const seconds = guesses / 1e10; // 10B guesses/sec
  const crackTime =
    seconds < 1 ? "instant" :
    seconds < 3600 ? `${Math.ceil(seconds / 60)} minutes` :
    seconds < 86400 ? `${Math.ceil(seconds / 3600)} hours` :
    seconds < 31536000 ? `${Math.ceil(seconds / 86400)} days` :
    seconds < 31536000 * 1000 ? `${Math.ceil(seconds / 31536000)} years` : "centuries";

  const suggestions: string[] = [];
  if (pw.length < 12) suggestions.push("Use at least 12 characters.");
  if (!/[A-Z]/.test(pw)) suggestions.push("Add uppercase letters.");
  if (!/[0-9]/.test(pw)) suggestions.push("Add digits.");
  if (!/[^a-zA-Z0-9]/.test(pw)) suggestions.push("Add symbols.");

  const score = bits < 28 ? 0 : bits < 36 ? 1 : bits < 60 ? 2 : bits < 128 ? 3 : 4;
  return { score, entropyBits: bits, crackTime, suggestions };
}

export async function validateRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: { email: string } }>(
    "/v1/validate/email",
    {
      schema: {
        summary: "Validate and normalise an email address",
        tags: ["validation"],
        body: { type: "object", required: ["email"], properties: { email: { type: "string", maxLength: 320 } } },
      },
    },
    async (req) => {
      const email = req.body.email.trim();
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
      let normalized = email.toLowerCase();
      const at = normalized.lastIndexOf("@");
      if (at > 0) {
        let local = normalized.slice(0, at);
        const domain = normalized.slice(at + 1);
        if (domain === "gmail.com" || domain === "googlemail.com") {
          local = local.split("+")[0].replace(/\./g, "");
          normalized = `${local}@gmail.com`;
        }
      }
      return { valid, normalized: valid ? normalized : null };
    },
  );

  app.post<{ Body: { number: string } }>(
    "/v1/validate/creditcard",
    {
      schema: {
        summary: "Validate a credit-card number (Luhn) and detect brand",
        tags: ["validation"],
        body: { type: "object", required: ["number"], properties: { number: { type: "string", maxLength: 40 } } },
      },
    },
    async (req) => {
      const digits = req.body.number.replace(/[\s-]/g, "");
      const valid = /^\d{12,19}$/.test(digits) && luhnValid(digits);
      return { valid, brand: valid ? cardBrand(digits) : null };
    },
  );

  app.post<{ Body: { iban: string } }>(
    "/v1/validate/iban",
    {
      schema: {
        summary: "Validate an IBAN (ISO 13616, mod-97)",
        tags: ["validation"],
        body: { type: "object", required: ["iban"], properties: { iban: { type: "string", maxLength: 40 } } },
      },
    },
    async (req) => {
      const { valid, formatted } = ibanValid(req.body.iban);
      return { valid, formatted, countryCode: valid ? formatted.slice(0, 2) : null };
    },
  );

  app.post<{ Body: { password: string } }>(
    "/v1/password/strength",
    {
      schema: {
        summary: "Estimate password strength (entropy, crack time)",
        tags: ["validation", "crypto"],
        body: { type: "object", required: ["password"], properties: { password: { type: "string", maxLength: 256 } } },
      },
    },
    async (req) => passwordStrength(req.body.password),
  );
}
