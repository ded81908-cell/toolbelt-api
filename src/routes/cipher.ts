import type { FastifyInstance } from "fastify";

const MORSE: Record<string, string> = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....",
  I: "..", J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.", O: "---", P: ".--.",
  Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-",
  Y: "-.--", Z: "--..", "0": "-----", "1": ".----", "2": "..---", "3": "...--",
  "4": "....-", "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.",
  ".": ".-.-.-", ",": "--..--", "?": "..--..", "'": ".----.", "!": "-.-.--",
  "/": "-..-.", "(": "-.--.", ")": "-.--.-", "&": ".-...", ":": "---...",
  "=": "-...-", "+": ".-.-.", "-": "-....-", '"': ".-..-.", "@": ".--.-.", " ": "/",
};
const MORSE_REV: Record<string, string> = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]));

export async function cipherRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: { text: string; action?: "encode" | "decode" } }>(
    "/v1/morse",
    {
      schema: {
        summary: "Encode or decode Morse code",
        description: "encode: text → Morse (letters space-separated, words by '/'). decode: Morse → text.",
        tags: ["text"],
        body: {
          type: "object",
          required: ["text"],
          properties: {
            text: { type: "string", maxLength: 20_000 },
            action: { type: "string", enum: ["encode", "decode"], default: "encode" },
          },
        },
      },
    },
    async (req) => {
      const action = req.body.action ?? "encode";
      if (action === "encode") {
        const result = [...req.body.text.toUpperCase()].map((c) => MORSE[c] ?? "").filter(Boolean).join(" ");
        return { action, result };
      }
      const result = req.body.text.trim().split(" ").map((code) => (code === "/" ? " " : MORSE_REV[code] ?? "")).join("");
      return { action, result };
    },
  );

  app.post<{ Body: { text: string; shift?: number; action?: "encode" | "decode" } }>(
    "/v1/cipher/caesar",
    {
      schema: {
        summary: "Caesar / ROT cipher",
        description: "Shifts letters by N (default 13 = ROT13). decode reverses the shift. Non-letters are unchanged.",
        tags: ["text"],
        body: {
          type: "object",
          required: ["text"],
          properties: {
            text: { type: "string", maxLength: 100_000 },
            shift: { type: "integer", minimum: -25, maximum: 25, default: 13 },
            action: { type: "string", enum: ["encode", "decode"], default: "encode" },
          },
        },
      },
    },
    async (req) => {
      const { text } = req.body;
      const shiftRaw = req.body.shift ?? 13;
      const shift = ((req.body.action === "decode" ? -shiftRaw : shiftRaw) % 26 + 26) % 26;
      const result = text.replace(/[a-zA-Z]/g, (ch) => {
        const base = ch <= "Z" ? 65 : 97;
        return String.fromCharCode(((ch.charCodeAt(0) - base + shift) % 26) + base);
      });
      return { result, shift: shiftRaw };
    },
  );
}
