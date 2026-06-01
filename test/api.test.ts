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
