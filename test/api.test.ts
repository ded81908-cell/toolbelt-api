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

describe("url", () => {
  it("parses a URL into components", async () => {
    const res = await auth({ url: "https://u:p@ex.com:8443/a/b?x=1&y=2#frag" }, "/v1/url/parse");
    const b = res.json();
    expect(b.hostname).toBe("ex.com");
    expect(b.port).toBe("8443");
    expect(b.query).toEqual({ x: "1", y: "2" });
  });
  it("builds a query string", async () => {
    const res = await auth({ action: "build", value: { a: 1, b: "two" } }, "/v1/url/query");
    expect(res.json().queryString).toBe("a=1&b=two");
  });
});

describe("number", () => {
  it("formats currency", async () => {
    const res = await auth({ value: 1234.5, style: "currency", currency: "USD" }, "/v1/number/format");
    expect(res.json().formatted).toBe("$1,234.50");
  });
  it("converts base 10 to base 16", async () => {
    const res = await auth({ value: "255", fromBase: 10, toBase: 16 }, "/v1/number/base");
    expect(res.json().result).toBe("ff");
  });
  it("converts integer to roman", async () => {
    const res = await auth({ value: 2024, to: "roman" }, "/v1/number/roman");
    expect(res.json().result).toBe("MMXXIV");
  });
  it("converts roman to integer", async () => {
    const res = await auth({ value: "MCMLXXXIV", to: "arabic" }, "/v1/number/roman");
    expect(res.json().result).toBe(1984);
  });
});

describe("id generators", () => {
  it("generates a nanoid of requested size", async () => {
    const res = await auth({ size: 12 }, "/v1/nanoid");
    expect(res.json().id).toHaveLength(12);
  });
  it("generates sortable ULIDs", async () => {
    const res = await auth({ count: 2 }, "/v1/ulid");
    const ids = res.json().ids;
    expect(ids).toHaveLength(2);
    expect(ids[0]).toMatch(/^[0-9A-Z]{26}$/);
  });
  it("generates a passphrase with N words", async () => {
    const res = await auth({ words: 5, separator: "." }, "/v1/passphrase");
    expect(res.json().passphrase.split(".")).toHaveLength(5);
  });
});

describe("text diff & entities", () => {
  it("diffs two texts", async () => {
    const res = await auth({ a: "one\ntwo\nthree", b: "one\n2\nthree" }, "/v1/text/diff");
    const b = res.json();
    expect(b.added).toBe(1);
    expect(b.removed).toBe(1);
  });
  it("encodes and decodes html entities", async () => {
    const enc = (await auth({ text: "<a href=\"x\">", action: "encode" }, "/v1/html/entities")).json();
    expect(enc.result).toBe("&lt;a href=&quot;x&quot;&gt;");
    const dec = (await auth({ text: "&lt;b&gt;&#65;", action: "decode" }, "/v1/html/entities")).json();
    expect(dec.result).toBe("<b>A");
  });
});

describe("time diff", () => {
  it("humanizes a duration", async () => {
    const res = await auth({ from: 0, to: 90061 }, "/v1/time/diff");
    expect(res.json().humanized).toBe("1 day, 1 hour");
  });
});

describe("checksum", () => {
  it("computes a known CRC32", async () => {
    const res = await auth({ text: "123456789" }, "/v1/checksum/crc32");
    expect(res.json().hex).toBe("cbf43926");
  });
});

describe("network", () => {
  it("calculates a /24 subnet", async () => {
    const res = await auth({ cidr: "192.168.1.10/24" }, "/v1/cidr");
    const b = res.json();
    expect(b.network).toBe("192.168.1.0");
    expect(b.broadcast).toBe("192.168.1.255");
    expect(b.netmask).toBe("255.255.255.0");
    expect(b.usableHosts).toBe(254);
  });
});

describe("mime", () => {
  it("looks up a png mime type", async () => {
    const res = await auth({ filename: "photo.PNG" }, "/v1/mime");
    expect(res.json().mime).toBe("image/png");
  });
});

describe("gravatar", () => {
  it("hashes an email to a gravatar url", async () => {
    const res = await auth({ email: " MyEmail@Example.com " }, "/v1/gravatar");
    // md5 of "myemail@example.com"
    expect(res.json().hash).toBe("60a6c20d49f49bc210ac98d7e47c74a0");
    expect(res.json().url).toContain("gravatar.com/avatar/");
  });
});

describe("number words", () => {
  it("spells an integer", async () => {
    const res = await auth({ value: 1234567 }, "/v1/number/words");
    expect(res.json().words).toBe("one million two hundred thirty four thousand five hundred sixty seven");
  });
});

describe("color palette", () => {
  it("returns tints, shades and complementary", async () => {
    const res = await auth({ color: "#2563eb" }, "/v1/color/palette");
    const b = res.json();
    expect(b.tints).toHaveLength(4);
    expect(b.shades).toHaveLength(4);
    expect(b.complementary).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe("text similarity", () => {
  it("scores identical strings as 1", async () => {
    const res = await auth({ a: "kitten", b: "kitten" }, "/v1/text/similarity");
    expect(res.json().similarity).toBe(1);
    expect(res.json().distance).toBe(0);
  });
  it("computes Levenshtein distance", async () => {
    const res = await auth({ a: "kitten", b: "sitting" }, "/v1/text/similarity");
    expect(res.json().distance).toBe(3);
  });
});

describe("timezones", () => {
  it("filters timezones by substring", async () => {
    const res = await auth({ filter: "Tokyo" }, "/v1/time/zones");
    expect(res.json().timezones).toContain("Asia/Tokyo");
  });
});

describe("creditcard generate", () => {
  it("generates Luhn-valid Visa numbers", async () => {
    const res = await auth({ brand: "visa", count: 3 }, "/v1/creditcard/generate");
    const nums = res.json().numbers;
    expect(nums).toHaveLength(3);
    for (const n of nums) {
      expect(n).toMatch(/^4\d{15}$/);
      // verify via the validator endpoint
      const v = await auth({ number: n }, "/v1/validate/creditcard");
      expect(v.json().valid).toBe(true);
    }
  });
});

describe("json format", () => {
  it("pretty-prints and minifies", async () => {
    const res = await auth({ json: '{"b":1,"a":2}', indent: 2, sortKeys: true }, "/v1/json/format");
    const b = res.json();
    expect(b.valid).toBe(true);
    expect(b.minified).toBe('{"a":2,"b":1}');
    expect(b.formatted).toContain('\n  "a": 2');
  });
  it("returns 422 for invalid json", async () => {
    const res = await auth({ json: "{nope}" }, "/v1/json/format");
    expect(res.statusCode).toBe(422);
  });
});

describe("jwt sign", () => {
  it("signs a token that round-trips through decode", async () => {
    const signed = await auth({ payload: { sub: "u1" }, secret: "s3cr3t", expiresIn: 3600 }, "/v1/jwt/sign");
    const token = signed.json().token;
    expect(token.split(".")).toHaveLength(3);
    const decoded = await auth({ token, secret: "s3cr3t" }, "/v1/jwt/decode");
    const b = decoded.json();
    expect(b.payload.sub).toBe("u1");
    expect(b.signatureValid).toBe(true);
    expect(b.expired).toBe(false);
  });
});

describe("bcrypt", () => {
  it("hashes and verifies a password", async () => {
    const hashed = await auth({ password: "hunter2", rounds: 4 }, "/v1/bcrypt/hash");
    const hash = hashed.json().hash;
    expect(hash).toMatch(/^\$2[aby]\$/);
    const ok = await auth({ password: "hunter2", hash }, "/v1/bcrypt/verify");
    expect(ok.json().match).toBe(true);
    const bad = await auth({ password: "wrong", hash }, "/v1/bcrypt/verify");
    expect(bad.json().match).toBe(false);
  });
});

describe("pii redact", () => {
  it("masks emails and card numbers", async () => {
    const res = await auth(
      { text: "Contact john.doe@example.com card 4111 1111 1111 1111" },
      "/v1/pii/redact",
    );
    const b = res.json();
    expect(b.counts.emails).toBe(1);
    expect(b.counts.cards).toBe(1);
    expect(b.redacted).not.toContain("john.doe@example.com");
    expect(b.redacted).toContain("1111");
  });
});

describe("uuid v5", () => {
  it("is deterministic and matches the known DNS vector", async () => {
    // uuidv5('example.com', DNS) is a well-known RFC test vector
    const res = await auth({ namespace: "dns", name: "example.com" }, "/v1/uuid/v5");
    expect(res.json().uuid).toBe("cfbff0d1-9375-5685-968c-48ce8b15ae17");
    const again = await auth({ namespace: "dns", name: "example.com" }, "/v1/uuid/v5");
    expect(again.json().uuid).toBe(res.json().uuid);
  });
});

describe("age", () => {
  it("computes whole years", async () => {
    const res = await auth({ birthdate: "2000-01-01", at: "2026-06-02" }, "/v1/age");
    expect(res.json().years).toBe(26);
  });
});

describe("markdown toc", () => {
  it("builds a TOC from headings", async () => {
    const res = await auth({ markdown: "# Title\n## Section A\n## Section B" }, "/v1/markdown/toc");
    const b = res.json();
    expect(b.count).toBe(3);
    expect(b.toc).toContain("- [Title](#title)");
    expect(b.toc).toContain("  - [Section A](#section-a)");
  });
});

describe("regex", () => {
  it("finds global matches with groups", async () => {
    const res = await auth({ pattern: "(\\w)(\\d)", text: "a1 b2", flags: "g" }, "/v1/regex/test");
    const b = res.json();
    expect(b.count).toBe(2);
    expect(b.matches[0].groups).toEqual(["a", "1"]);
  });
  it("returns 422 for an invalid pattern", async () => {
    const res = await auth({ pattern: "(", text: "x" }, "/v1/regex/test");
    expect(res.statusCode).toBe(422);
  });
});

describe("useragent", () => {
  it("parses an iPhone Safari UA", async () => {
    const res = await auth(
      { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605 Version/17.0 Mobile Safari/604" },
      "/v1/useragent/parse",
    );
    const b = res.json();
    expect(b.os.name).toBe("iOS");
    expect(b.device.vendor).toBe("Apple");
  });
});

describe("cipher", () => {
  it("encodes Morse", async () => {
    const res = await auth({ text: "SOS" }, "/v1/morse");
    expect(res.json().result).toBe("... --- ...");
  });
  it("round-trips ROT13", async () => {
    const enc = (await auth({ text: "Hello, World" }, "/v1/cipher/caesar")).json().result;
    const dec = (await auth({ text: enc, action: "decode" }, "/v1/cipher/caesar")).json().result;
    expect(dec).toBe("Hello, World");
  });
});

describe("base32", () => {
  it("round-trips", async () => {
    const enc = (await auth({ input: "hello" }, "/v1/encode/base32")).json().result;
    expect(enc).toBe("NBSWY3DP");
    const dec = (await auth({ input: enc, action: "decode" }, "/v1/encode/base32")).json().result;
    expect(dec).toBe("hello");
  });
});

describe("ip info", () => {
  it("classifies a private IPv4", async () => {
    const res = await auth({ ip: "10.1.2.3" }, "/v1/ip/info");
    expect(res.json()).toEqual({ valid: true, version: 4, type: "private" });
  });
  it("recognises IPv6 loopback", async () => {
    const res = await auth({ ip: "::1" }, "/v1/ip/info");
    expect(res.json().version).toBe(6);
  });
});

describe("json diff & get", () => {
  it("diffs two objects", async () => {
    const res = await auth({ a: { x: 1, y: 2 }, b: { x: 1, y: 3, z: 4 } }, "/v1/json/diff");
    const b = res.json();
    expect(b.added).toEqual({ z: 4 });
    expect(b.changed).toEqual({ y: { from: 2, to: 3 } });
  });
  it("gets a nested value by path", async () => {
    const res = await auth({ data: { user: { tags: ["a", "b"] } }, path: "user.tags[1]" }, "/v1/json/get");
    expect(res.json().value).toBe("b");
  });
});

describe("date add & business days", () => {
  it("adds months and days", async () => {
    const res = await auth({ date: "2026-01-01", months: 2, days: 10 }, "/v1/date/add");
    expect(res.json().iso).toBe("2026-03-11T00:00:00.000Z");
  });
  it("counts business days in a week", async () => {
    const res = await auth({ from: "2026-06-01", to: "2026-06-08" }, "/v1/date/business-days");
    expect(res.json().businessDays).toBe(5);
  });
});

describe("uuid validate & random", () => {
  it("validates a v5 UUID", async () => {
    const res = await auth({ uuid: "cfbff0d1-9375-5685-968c-48ce8b15ae17" }, "/v1/uuid/validate");
    expect(res.json()).toEqual({ valid: true, version: 5, variant: "RFC 4122" });
  });
  it("generates random integers in range", async () => {
    const res = await auth({ min: 1, max: 6, count: 50 }, "/v1/random/number");
    const nums = res.json().numbers;
    expect(nums).toHaveLength(50);
    expect(Math.min(...nums)).toBeGreaterThanOrEqual(1);
    expect(Math.max(...nums)).toBeLessThanOrEqual(6);
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
