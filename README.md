# Toolbelt API

A **pay-as-you-go developer utility API**. One endpoint family for the boring,
high-frequency tasks every app needs — with **zero AI/inference cost**, so the
gross margin is near 100%.

| Endpoint | What it does |
| --- | --- |
| `POST /v1/qr` | QR code as PNG or SVG (size, colors, error-correction) |
| `POST /v1/og-image` | Social / Open Graph card as SVG (themes, title, subtitle, badge) |
| `POST /v1/convert` | Convert between JSON ⇄ YAML ⇄ CSV |
| `POST /v1/hash` | MD5 / SHA1 / SHA256 / SHA512, optional HMAC |
| `POST /v1/encode` | Base64 / URL / hex encode & decode |
| `GET  /v1/uuid` | UUID v4 (bulk) |
| `GET  /v1/password` | Cryptographically strong passwords |
| `GET  /v1/token` | URL-safe random tokens |
| `POST /v1/slug` | Slugify a string |
| `POST /v1/jp/convert` | 🇯🇵 Full-width⇄half-width, hiragana⇄katakana, kana→romaji |
| `POST /v1/jp/slug` | 🇯🇵 Romaji slug from Japanese text |
| `POST /v1/qr/bulk` | Up to 200 QR codes in one call |
| `POST /v1/hash/bulk` | Hash many strings in one call |
| `POST /v1/barcode` | Code128 / EAN / UPC / ITF / DataMatrix / PDF417 |
| `POST /v1/invoice` | Render a printable invoice (SVG) with computed totals |
| `POST /v1/translit` | 🌍 Transliterate to Latin (accents, Cyrillic, Greek) |
| `POST /v1/slug/intl` | 🌍 URL slug from any-language text |
| `POST /v1/phone` | 🌍 Parse/validate/format phone numbers (E.164, …) |
| `POST /v1/postal` | 🌍 Validate & normalise postal codes (JP/US/CA/GB/DE/FR) |
| `POST /v1/currency/convert` | 🌍 Convert amounts (offline rates or cached live) |
| `POST /v1/markdown` | Markdown → sanitized, print-ready HTML |
| `POST /v1/qr/wifi` · `/v1/qr/vcard` | Wi-Fi join & contact (vCard) QR codes |
| `POST /v1/color/convert` · `/v1/color/contrast` | hex⇄rgb⇄hsl + WCAG contrast |
| `POST /v1/text/case` · `/v1/text/stats` · `/v1/html/strip` | case convert, stats, tag stripping |
| `POST /v1/lorem` | Lorem ipsum placeholder text |
| `POST /v1/time/convert` | Unix⇄ISO + timezone formatting |
| `POST /v1/jwt/decode` | Decode (+ optional HMAC verify) a JWT |
| `POST /v1/units/convert` | Length/mass/data/temperature/… conversion |
| `POST /v1/geo/distance` | Great-circle (Haversine) distance |
| `POST /v1/validate/email` · `/creditcard` · `/iban` | Validators (Luhn, mod-97, syntax) |
| `POST /v1/password/strength` | Entropy & crack-time estimate |
| `POST /v1/url/parse` · `/v1/url/query` | Parse URLs / build & parse query strings |
| `POST /v1/number/format` · `/base` · `/roman` | Locale format, base (2–36), Roman numerals |
| `POST /v1/nanoid` · `/v1/ulid` · `/v1/passphrase` | ID & passphrase generators |
| `POST /v1/text/diff` · `/v1/html/entities` | Line diff; HTML entity encode/decode |
| `POST /v1/time/diff` | Humanized duration between timestamps |
| `POST /v1/checksum/crc32` | CRC32 checksum |
| `POST /v1/cidr` | IPv4 subnet / CIDR calculator |
| `POST /v1/mime` | MIME type lookup by filename/extension |
| `POST /v1/gravatar` | Gravatar avatar URL from an email |
| `POST /v1/number/words` | Spell an integer in English words |
| `POST /v1/color/palette` | Tints / shades / complementary from a color |
| `POST /v1/text/similarity` | Levenshtein distance + similarity ratio |
| `POST /v1/time/zones` | List IANA timezones (filterable) |
| `POST /v1/creditcard/generate` | Luhn-valid **test** card numbers |
| `POST /v1/json/format` | Validate, pretty-print or minify JSON |
| `POST /v1/jwt/sign` | Sign an HS256/384/512 JWT |
| `POST /v1/bcrypt/hash` · `/v1/bcrypt/verify` | bcrypt password hashing & verify |
| `POST /v1/pii/redact` | Mask emails / cards / phones in text |
| `POST /v1/uuid/v5` | Deterministic namespaced UUID |
| `POST /v1/age` | Age / elapsed time from a date |
| `POST /v1/markdown/toc` | Table of contents from Markdown |
| `POST /v1/regex/test` | Test a regex, return matches & groups |
| `POST /v1/useragent/parse` | Parse a User-Agent (browser/os/device) |
| `POST /v1/morse` | Morse code encode / decode |
| `POST /v1/cipher/caesar` | Caesar / ROT cipher |
| `POST /v1/encode/base32` | Base32 encode / decode (RFC 4648) |
| `POST /v1/ip/info` | Validate & classify an IP (v4/v6) |
| `POST /v1/json/diff` · `/v1/json/get` | Diff JSON / extract by path |
| `POST /v1/date/add` · `/v1/date/business-days` | Date math & business-day count |
| `POST /v1/uuid/validate` | Validate a UUID & detect version |
| `POST /v1/random/number` · `/v1/random/pick` | Secure random numbers / picks |
| `GET  /v1/usage` | The calling client's own usage counters |
| `GET  /health` | Liveness (unauthenticated) |
| `GET  /docs` | Interactive OpenAPI (Swagger UI) |

## Quick start (local)

```bash
npm install
cp .env.example .env          # then edit API_KEYS
npm run dev                    # http://localhost:3000  (docs at /docs)
```

```bash
curl -X POST http://localhost:3000/v1/qr \
  -H "X-API-Key: demo-key" -H "Content-Type: application/json" \
  -d '{"text":"https://example.com","format":"png"}' --output qr.png
```

## Build / test

```bash
npm run build      # tsc -> dist/
npm test           # vitest, 93 tests
npm run typecheck  # no-emit type check (also runs in CI)
```

## Authentication & tiers

Three accepted paths (see `src/auth.ts`):

1. **RapidAPI gateway** — when listed on RapidAPI, the gateway forwards
   `X-RapidAPI-Proxy-Secret`. Set `RAPIDAPI_PROXY_SECRET` to trust only that
   traffic. **RapidAPI handles keys, metering and billing for you.** Mapped to the
   `pro` tier.
2. **Direct API key** — `X-API-Key` header, validated against `API_KEYS`
   (`key:tier` pairs, e.g. `API_KEYS=alice:pro,bob:free`).
3. **Anonymous** — only when `ALLOW_ANONYMOUS=true` (local/dev).

Rate limits are per-client, per-tier (`RATE_LIMIT_FREE/PRO/ULTRA`, requests/min).

## Deploy

### Option A — Render (fastest, free tier, no card)
`render.yaml` is included. Push to GitHub → New → Blueprint → pick this repo →
set `API_KEYS` (and `RAPIDAPI_PROXY_SECRET`) as env vars in the dashboard. Done.

### Option B — Docker anywhere
```bash
docker build -t toolbelt-api .
docker run -p 3000:3000 -e API_KEYS="customer-1:pro" toolbelt-api
```
Works on Fly.io, Railway, Cloud Run, a $5 VPS, etc.

## Monetization playbook (shortest path to first revenue)

This service is designed so the **marketplace does the hard parts** (signup,
keys, billing, invoicing, chargebacks):

1. **Deploy** the API to a public URL (Render free tier is enough to start).
2. **Set `RAPIDAPI_PROXY_SECRET`** and lock direct access (leave `API_KEYS` for
   your own/private customers only).
3. **List on [RapidAPI Hub](https://rapidapi.com/)**: import the OpenAPI spec
   from `/docs/json`, point the base URL at your deploy, and set the
   proxy-secret header. RapidAPI generates the pricing page, API keys, usage
   metering and **collects payment for you** (you keep ~80%).
4. **Price with tiers**, e.g. Free 500 req/mo, Pro $9/mo for 50k, Ultra $49/mo
   for 1M + overage. Because there is no inference cost, almost all of this is
   margin.
5. **(Optional) Direct/Stripe billing later** — usage is already metered in
   `src/usage.ts`; swap the in-memory meter for Redis and push counters to
   Stripe metered billing when you outgrow the marketplace.

> Honest note: deploying, the RapidAPI listing, and connecting a payout account
> require **your** accounts and cannot be done from inside this repo. Everything
> in code — auth, metering, rate limits, docs, deploy config — is ready so those
> are the only manual steps left.

## Project layout

```
src/
  index.ts        entrypoint
  server.ts       Fastify app: auth + rate-limit + metering hooks, plugins
  config.ts       env parsing (keys, tiers, limits)
  auth.ts         API-key / RapidAPI / anonymous auth
  usage.ts        in-memory usage meter (billing export point)
  lib/csv.ts      dependency-free CSV <-> JSON
  lib/jp.ts       Japanese text (kana, width, romaji) — no deps
  lib/translit.ts transliteration (Latin/Cyrillic/Greek) — no deps
  routes/         qr, ogimage, convert, hash, generate, meta,
                  jp, bulk, barcode, invoice, markdown,
                  intl (translit/phone/postal), currency,
                  color, text, datetime, jwt, validate, units, geo,
                  qrextra (wifi/vcard), url, number, idgen, checksum,
                  network (cidr/ip), mime, gravatar, json, bcrypt, pii,
                  regex, useragent, cipher, encoding
public/index.html landing page
test/api.test.ts  end-to-end tests
```

## License

MIT
