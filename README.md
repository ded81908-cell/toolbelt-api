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
npm test           # vitest, 14 tests
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
                  jp, bulk, barcode, invoice,
                  intl (translit/phone/postal), currency, markdown
public/index.html landing page
test/api.test.ts  end-to-end tests
```

## License

MIT
