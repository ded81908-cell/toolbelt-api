import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildServer } from "../src/server.js";
import { loadConfig } from "../src/config.js";

const KEY = "test-key";

let app: FastifyInstance;

beforeAll(async () => {
  const config = loadConfig({
    API_KEYS: `${KEY}:pro`,
    ALLOW_ANONYMOUS: "false",
    RATE_LIMIT_PRO: "100000",
    RATE_LIMIT_FREE: "100000",
  } as NodeJS.ProcessEnv);
  app = await buildServer(config);
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

function auth(payload: object, url: string) {
  return app.inject({ method: "POST", url, headers: { "x-api-key": KEY }, payload });
}

describe("auth", () => {
  it("rejects requests without a key", async () => {
    const res = await app.inject({ method: "POST", url: "/v1/hash", payload: { input: "x" } });
    expect(res.statusCode).toBe(401);
  });

  it("allows the health check without a key", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe("ok");
  });
});

describe("qr", () => {
  it("returns a PNG by default", async () => {
    const res = await auth({ text: "https://example.com" }, "/v1/qr");
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toBe("image/png");
    expect(res.rawPayload.slice(0, 4).toString("hex")).toBe("89504e47"); // PNG magic
  });

  it("returns SVG when requested", async () => {
    const res = await auth({ text: "hi", format: "svg" }, "/v1/qr");
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("image/svg+xml");
    expect(res.body).toContain("<svg");
  });
});

describe("og-image", () => {
  it("renders a card with the title", async () => {
    const res = await auth({ title: "Hello World", subtitle: "sub", badge: "new" }, "/v1/og-image");
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain("Hello World");
    expect(res.body).toContain("<svg");
  });
});

describe("convert", () => {
  it("json -> yaml", async () => {
    const res = await auth({ from: "json", to: "yaml", data: '{"a":1,"b":[1,2]}' }, "/v1/convert");
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain("a: 1");
  });

  it("csv -> json round trips", async () => {
    const res = await auth(
      { from: "csv", to: "json", data: "name,age\nAlice,30\nBob,25" },
      "/v1/convert",
    );
    expect(res.statusCode).toBe(200);
    const parsed = JSON.parse(res.body);
    expect(parsed).toEqual([
      { name: "Alice", age: "30" },
      { name: "Bob", age: "25" },
    ]);
  });

  it("json -> csv with quoting", async () => {
    const res = await auth(
      { from: "json", to: "csv", data: '[{"a":"x,y","b":"1"}]' },
      "/v1/convert",
    );
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('"x,y"');
  });

  it("returns 422 on invalid input", async () => {
    const res = await auth({ from: "json", to: "yaml", data: "{not json" }, "/v1/convert");
    expect(res.statusCode).toBe(422);
  });
});

describe("hash & encode", () => {
  it("computes sha256", async () => {
    const res = await auth({ input: "abc" }, "/v1/hash");
    expect(res.json().digest).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("round trips base64", async () => {
    const enc = await auth({ input: "héllo", operation: "base64-encode" }, "/v1/encode");
    const encoded = enc.json().result;
    const dec = await auth({ input: encoded, operation: "base64-decode" }, "/v1/encode");
    expect(dec.json().result).toBe("héllo");
  });
});

describe("generators", () => {
  it("generates uuids", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/uuid?count=3",
      headers: { "x-api-key": KEY },
    });
    expect(res.json().uuids).toHaveLength(3);
  });

  it("slugifies", async () => {
    const res = await auth({ text: "Héllo, World! 2024" }, "/v1/slug");
    expect(res.json().slug).toBe("hello-world-2024");
  });
});

describe("japanese", () => {
  it("converts full-width to half-width", async () => {
    const res = await auth({ text: "ＡＢＣ１２３", operation: "hankaku" }, "/v1/jp/convert");
    expect(res.json().result).toBe("ABC123");
  });

  it("converts hiragana to katakana", async () => {
    const res = await auth({ text: "とうきょう", operation: "katakana" }, "/v1/jp/convert");
    expect(res.json().result).toBe("トウキョウ");
  });

  it("romanizes kana", async () => {
    const res = await auth({ text: "にっぽん", operation: "romaji" }, "/v1/jp/convert");
    expect(res.json().result).toBe("nippon");
  });

  it("builds a romaji slug from Japanese", async () => {
    const res = await auth({ text: "東京タワー" }, "/v1/jp/slug");
    // 東京 is kanji (passes through), タワー -> tawa
    expect(res.json().slug).toContain("tawa");
  });
});

describe("bulk", () => {
  it("generates multiple QR codes", async () => {
    const res = await auth(
      { items: [{ text: "a", id: "x" }, { text: "b" }], format: "png" },
      "/v1/qr/bulk",
    );
    const body = res.json();
    expect(body.count).toBe(2);
    expect(body.results[0].id).toBe("x");
    expect(body.results[0].data).toMatch(/^data:image\/png;base64,/);
  });

  it("hashes many inputs", async () => {
    const res = await auth({ inputs: ["a", "b", "c"] }, "/v1/hash/bulk");
    expect(res.json().digests).toHaveLength(3);
  });
});

describe("barcode", () => {
  it("generates a code128 PNG", async () => {
    const res = await auth({ type: "code128", text: "ABC-123" }, "/v1/barcode");
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toBe("image/png");
    expect(res.rawPayload.slice(0, 4).toString("hex")).toBe("89504e47");
  });

  it("returns 422 for an invalid EAN-13 value", async () => {
    const res = await auth({ type: "ean13", text: "not-a-number" }, "/v1/barcode");
    expect(res.statusCode).toBe(422);
  });
});

describe("invoice", () => {
  it("renders an SVG with computed total", async () => {
    const res = await auth(
      {
        number: "INV-001",
        date: "2026-06-01",
        currency: "USD",
        taxRate: 10,
        from: { name: "Acme" },
        to: { name: "Client" },
        items: [
          { description: "Design", quantity: 2, unitPrice: 100 },
          { description: "Hosting", quantity: 1, unitPrice: 50 },
        ],
      },
      "/v1/invoice",
    );
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("image/svg+xml");
    // subtotal 250, +10% tax = 275
    expect(res.body).toContain("INVOICE");
    expect(res.body).toContain("$275.00");
  });
});

describe("intl / transliteration", () => {
  it("strips Latin diacritics", async () => {
    const res = await auth({ text: "Crème brûlée" }, "/v1/translit");
    expect(res.json().result).toBe("Creme brulee");
  });

  it("romanises Cyrillic", async () => {
    const res = await auth({ text: "Москва" }, "/v1/translit");
    expect(res.json().result).toBe("Moskva");
  });

  it("builds an intl slug from Greek", async () => {
    const res = await auth({ text: "Ελλάδα 2026!" }, "/v1/slug/intl");
    expect(res.json().slug).toBe("ellada-2026");
  });

  it("parses and formats a phone number", async () => {
    const res = await auth({ number: "+81 90-1234-5678" }, "/v1/phone");
    const body = res.json();
    expect(body.valid).toBe(true);
    expect(body.country).toBe("JP");
    expect(body.e164).toBe("+819012345678");
  });

  it("normalises a Japanese postal code", async () => {
    const res = await auth({ code: "1500001", country: "JP" }, "/v1/postal");
    expect(res.json().formatted).toBe("150-0001");
  });
});

describe("currency", () => {
  it("converts using provided rates (offline)", async () => {
    const res = await auth(
      { from: "USD", to: "JPY", amount: 10, base: "USD", rates: { JPY: 150, EUR: 0.9 } },
      "/v1/currency/convert",
    );
    const body = res.json();
    expect(body.source).toBe("provided");
    expect(body.result).toBe(1500);
  });

  it("cross-converts non-base currencies", async () => {
    const res = await auth(
      { from: "EUR", to: "JPY", amount: 10, base: "USD", rates: { JPY: 150, EUR: 0.5 } },
      "/v1/currency/convert",
    );
    // 10 EUR -> 20 USD -> 3000 JPY
    expect(res.json().result).toBe(3000);
  });
});

describe("markdown", () => {
  it("renders markdown to html and strips scripts", async () => {
    const res = await auth(
      { markdown: "# Hi\n\n**bold** <script>alert(1)</script>" },
      "/v1/markdown",
    );
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain("<h1");
    expect(res.body).toContain("<strong>bold</strong>");
    expect(res.body).not.toContain("<script>");
  });

  it("wraps a full document when requested", async () => {
    const res = await auth({ markdown: "# Doc", fullDocument: true, title: "T" }, "/v1/markdown");
    expect(res.body).toContain("<!doctype html>");
    expect(res.body).toContain("<title>T</title>");
  });
});

describe("color", () => {
  it("converts hex to rgb and hsl", async () => {
    const res = await auth({ color: "#ff0000" }, "/v1/color/convert");
    const b = res.json();
    expect(b.rgb).toEqual({ r: 255, g: 0, b: 0 });
    expect(b.hsl.h).toBe(0);
  });
  it("computes WCAG contrast (black on white = 21)", async () => {
    const res = await auth({ foreground: "#000000", background: "#ffffff" }, "/v1/color/contrast");
    const b = res.json();
    expect(b.ratio).toBe(21);
    expect(b.normalText.AAA).toBe(true);
  });
});

describe("text", () => {
  it("converts to snake_case", async () => {
    const res = await auth({ text: "Hello World API", target: "snake" }, "/v1/text/case");
    expect(res.json().result).toBe("hello_world_api");
  });
  it("computes word stats", async () => {
    const res = await auth({ text: "one two three." }, "/v1/text/stats");
    expect(res.json().words).toBe(3);
  });
  it("generates lorem words", async () => {
    const res = await auth({ units: "words", count: 5 }, "/v1/lorem");
    expect(res.json().text.split(" ")).toHaveLength(5);
  });
  it("strips html tags", async () => {
    const res = await auth({ html: "<p>Hi <b>there</b></p><script>x()</script>" }, "/v1/html/strip");
    expect(res.json().text).toBe("Hi there");
  });
});

describe("time", () => {
  it("converts unix to iso", async () => {
    const res = await auth({ input: 0, timezone: "UTC" }, "/v1/time/convert");
    expect(res.json().iso).toBe("1970-01-01T00:00:00.000Z");
  });
});

describe("jwt", () => {
  it("decodes and verifies an HS256 token", async () => {
    // {"alg":"HS256"}.{"sub":"42"} signed with secret "secret"
    const { createHmac } = await import("node:crypto");
    const h = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const p = Buffer.from(JSON.stringify({ sub: "42" })).toString("base64url");
    const sig = createHmac("sha256", "secret").update(`${h}.${p}`).digest("base64url");
    const res = await auth({ token: `${h}.${p}.${sig}`, secret: "secret" }, "/v1/jwt/decode");
    const b = res.json();
    expect(b.payload.sub).toBe("42");
    expect(b.signatureValid).toBe(true);
  });
});

describe("validation", () => {
  it("validates a Luhn-valid card and detects Visa", async () => {
    const res = await auth({ number: "4111 1111 1111 1111" }, "/v1/validate/creditcard");
    expect(res.json()).toEqual({ valid: true, brand: "Visa" });
  });
  it("normalises a gmail address", async () => {
    const res = await auth({ email: "John.Doe+spam@Gmail.com" }, "/v1/validate/email");
    expect(res.json().normalized).toBe("johndoe@gmail.com");
  });
  it("validates an IBAN", async () => {
    const res = await auth({ iban: "GB82 WEST 1234 5698 7654 32" }, "/v1/validate/iban");
    expect(res.json().valid).toBe(true);
  });
  it("scores a strong password higher than a weak one", async () => {
    const weak = (await auth({ password: "abc" }, "/v1/password/strength")).json();
    const strong = (await auth({ password: "Tr0ub4dour&3xplosion!" }, "/v1/password/strength")).json();
    expect(strong.score).toBeGreaterThan(weak.score);
  });
});

describe("units", () => {
  it("converts km to mi", async () => {
    const res = await auth({ value: 1, from: "km", to: "mi" }, "/v1/units/convert");
    expect(res.json().result).toBeCloseTo(0.621371, 4);
  });
  it("converts celsius to fahrenheit", async () => {
    const res = await auth({ value: 100, from: "c", to: "f" }, "/v1/units/convert");
    expect(res.json().result).toBe(212);
  });
});

describe("geo", () => {
  it("computes distance between two coordinates", async () => {
    // Tokyo -> Osaka ~ 400km
    const res = await auth(
      { from: { lat: 35.68, lon: 139.77 }, to: { lat: 34.69, lon: 135.5 }, unit: "km" },
      "/v1/geo/distance",
    );
    expect(res.json().distance).toBeGreaterThan(380);
    expect(res.json().distance).toBeLessThan(420);
  });
});

describe("qr extra", () => {
  it("generates a Wi-Fi QR PNG", async () => {
    const res = await auth({ ssid: "MyNet", password: "p@ss", encryption: "WPA" }, "/v1/qr/wifi");
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toBe("image/png");
  });
  it("generates a vCard QR SVG", async () => {
    const res = await auth({ name: "Jane Doe", email: "jane@x.com", format: "svg" }, "/v1/qr/vcard");
    expect(res.headers["content-type"]).toContain("image/svg");
    expect(res.body).toContain("<svg");
  });
});

describe("usage", () => {
  it("reports counters for the caller", async () => {
    await auth({ input: "x" }, "/v1/hash");
    const res = await app.inject({
      method: "GET",
      url: "/v1/usage",
      headers: { "x-api-key": KEY },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().total).toBeGreaterThan(0);
  });
});
