# RapidAPI Listing Content — Global / English Edition

Copy-paste content for the **global (English) listing** on RapidAPI Hub —
About, Tutorials, Spotlights, Discussions and Getting Started. All English,
reflecting the current **80-endpoint** scope.

> Same code, same Base URL, same Proxy Secret as the Japanese listing — only the
> copy differs. Replace `{HOST}` (e.g. `toolbelt-api.p.rapidapi.com`) and
> `YOUR_KEY` with your own values.

---

# 0. Import & connect (do this first)

1. Provider Dashboard → **Add New API** → **OpenAPI**
2. Definition: point to **`https://toolbelt-api-9oll.onrender.com/docs/json`**
   (or upload the same JSON). Verified: `OpenAPI 3.0.3 / 80 operations`.
3. **Base URL:** `https://toolbelt-api-9oll.onrender.com`
4. **Security:** API key in `X-API-Key` (header). RapidAPI's generated proxy
   secret must match Render's `RAPIDAPI_PROXY_SECRET` env var (same value as the
   Japanese listing) so only RapidAPI traffic is trusted.
5. Set the **pricing plans** below → Publish.

---

# 1. General tab

**Name**
```
Toolbelt API — QR Code, Barcode, Invoice, JSON, JWT & i18n Utilities
```

**Short description (≈150 chars)**
```
80 developer utilities in one API: QR code & barcode generator, invoice (SVG) & PDF-ready Markdown, JSON formatter, hashing, JWT, bcrypt, UUID, email/IBAN/credit-card validation, phone & currency, plus a Japanese text toolkit. Fast, deterministic, no AI cost.
```

**Long description**
```
Toolbelt API is a fast, deterministic developer-utility REST API. Generate QR codes
and barcodes (Code128, EAN, UPC, PDF417), render invoices and Markdown to HTML,
format and validate JSON, hash and sign data (SHA, MD5, HMAC, JWT, bcrypt), create
UUIDs/ULIDs, validate emails, IBANs and credit cards, parse phone numbers (E.164),
convert units, timezones and currencies, and process Japanese text — all behind one
base URL, with no AI/inference cost.

▸ QR & barcodes: QR plus Code128/EAN/UPC/ITF/DataMatrix/PDF417 (PNG or SVG)
▸ Documents: invoices (SVG, auto-computed totals), Markdown → sanitized HTML
▸ Data: JSON⇄YAML⇄CSV, hashing (SHA/MD5/HMAC), base64/url/hex
▸ Generators: UUIDs, strong passwords, tokens, slugs, NanoIDs, ULIDs
▸ Bulk: up to 200 items per request
▸ Internationalisation: transliteration (accents, Cyrillic, Greek), phone parse/format (E.164), postal-code normalisation (JP/US/CA/GB/DE/FR), currency conversion
▸ Japanese pack: width, kana and romaji conversion
▸ Dev tools: JWT decode/sign, bcrypt, colour convert/WCAG contrast, unit/time/geo conversion, regex test, user-agent parse, IP info, CIDR calculator
▸ Validators: email, credit card (Luhn), IBAN, password strength, PII redaction
▸ Structured QR: Wi-Fi join, contact (vCard)

Why
- No AI/inference cost → cheap, fast, deterministic results
- Try every endpoint interactively at /docs (Swagger UI)
- Simple auth via the X-API-Key header (handled by RapidAPI)

Start free, scale as you grow.
```

**Category:** `Tools`

**Tags / keywords**
```
qr-code, barcode, invoice, markdown, json, jwt, bcrypt, uuid, hashing, slug, transliteration, phone, postal, currency, japanese, i18n, utilities, validation
```

---

# 2. Pricing plans

| Plan | Monthly | Requests included | Overage | Burst (built-in) |
|---|---|---|---|---|
| **BASIC** (free) | $0 | 1,000 / mo (hard cap) | – | 30 req/min |
| **PRO** | $9.99 | 50,000 / mo | $0.0004 / req | 300 req/min |
| **ULTRA** | $29.99 | 300,000 / mo | $0.0002 / req | 3,000 req/min |
| **MEGA** | $99.99 | 2,000,000 / mo | $0.0001 / req | 3,000 req/min |

> Prices are a starting point. Tune them after launch using RapidAPI analytics
> (free→paid conversion, churn, popular endpoints). A generous free tier early on
> maximises sign-ups and reviews.

---

# 3. Getting Started

```markdown
## Getting Started

**1. Subscribe to a plan** — start with the free BASIC plan on RapidAPI.

**2. Get your API key** — you'll receive an `X-RapidAPI-Key`; send it on every request.

**3. Make your first call**
\`\`\`bash
curl -X POST "https://{HOST}/v1/qr" \
  -H "X-RapidAPI-Key: YOUR_KEY" \
  -H "X-RapidAPI-Host: {HOST}" \
  -H "Content-Type: application/json" \
  -d '{"text":"https://example.com","format":"png","size":512}' \
  --output qr.png
\`\`\`

That returns a PNG QR code. Try any of the 80 endpoints interactively in the **Endpoints** tab.

- Auth: `X-RapidAPI-Key` header (added by RapidAPI)
- Responses: JSON or images (PNG/SVG)
- Errors: `4xx` with a JSON error message
```

---

# 4. Tutorials

> In the **Tutorials** tab, click "New Tutorial" and paste each article body below.

## Tutorial 1 — Generate a QR code

```markdown
### Generate a QR code

`POST /v1/qr` takes a text string and returns a QR code as PNG or SVG.

**Request**
\`\`\`json
{ "text": "https://example.com", "format": "png", "size": 512, "ecc": "M" }
\`\`\`

**curl**
\`\`\`bash
curl -X POST "https://{HOST}/v1/qr" \
  -H "X-RapidAPI-Key: YOUR_KEY" -H "X-RapidAPI-Host: {HOST}" \
  -H "Content-Type: application/json" \
  -d '{"text":"https://example.com","format":"svg"}' > qr.svg
\`\`\`

**Tips**
- `format`: `png` (default) or `svg`
- `ecc`: error-correction level `L/M/Q/H`
- Bulk generation: `POST /v1/qr/bulk` (up to 200 per request)
- Wi-Fi join QR: `POST /v1/qr/wifi` — vCard contact: `POST /v1/qr/vcard`
```

## Tutorial 2 — Japanese text processing

```markdown
### Normalize & romanize Japanese text

`POST /v1/jp/convert` handles full-width⇄half-width, kana conversion and romanization.

**Full-width → half-width**
\`\`\`bash
curl -X POST "https://{HOST}/v1/jp/convert" \
  -H "X-RapidAPI-Key: YOUR_KEY" -H "X-RapidAPI-Host: {HOST}" \
  -H "Content-Type: application/json" \
  -d '{"text":"ＡＢＣ１２３","operation":"hankaku"}'
# → {"operation":"hankaku","result":"ABC123"}
\`\`\`

**Romanize**
\`\`\`bash
-d '{"text":"とうきょう","operation":"romaji"}'
# → {"result":"toukyou"}
\`\`\`

`operation`: `hankaku` / `zenkaku` / `hiragana` / `katakana` / `romaji`.
URL slugs from Japanese: `POST /v1/jp/slug` (e.g. 東京タワー → tokyotawa).
```

## Tutorial 3 — Generate an invoice

```markdown
### Generate a printable invoice (SVG)

`POST /v1/invoice` takes line items and returns a print-ready SVG with auto-computed subtotal, tax and total.

\`\`\`bash
curl -X POST "https://{HOST}/v1/invoice" \
  -H "X-RapidAPI-Key: YOUR_KEY" -H "X-RapidAPI-Host: {HOST}" \
  -H "Content-Type: application/json" \
  -d '{
    "number":"INV-001","date":"2026-06-01","currency":"USD","taxRate":10,
    "from":{"name":"My Co."},"to":{"name":"Client"},
    "items":[{"description":"Service","quantity":2,"unitPrice":100}]
  }'
\`\`\`

The returned SVG renders directly in a browser and can be saved as PDF via the browser print dialog. Multi-currency support via `currency` and `locale` fields.
```

## Tutorial 4 — Validate & format phone numbers

```markdown
### Validate & format phone numbers

`POST /v1/phone` is an international phone parser (libphonenumber-based).

\`\`\`bash
curl -X POST "https://{HOST}/v1/phone" \
  -H "X-RapidAPI-Key: YOUR_KEY" -H "X-RapidAPI-Host: {HOST}" \
  -H "Content-Type: application/json" \
  -d '{"number":"+1 (650) 555-0123","country":"US"}'
\`\`\`

**Response**
\`\`\`json
{ "valid": true, "e164": "+16505550123",
  "national": "(650) 555-0123", "international": "+1 650-555-0123",
  "country": "US", "type": "fixed_line_or_mobile" }
\`\`\`

Related: `POST /v1/postal` (postal code normalisation) and `POST /v1/currency/convert`.
```

---

# 5. Spotlights (Overview highlights)

> In the Overview tab, **"Add Spotlight"** one at a time. Each spotlight is a
> title + description (+ image/PDF). Use the EN spotlight cards in
> `public/brand/spotlight/spotlight-{1..4}-en.pdf` or the banner PNGs.

### Spotlight 1 — Value proposition
- **Title:** 80 tools in one API — zero AI cost
- **Description:** QR & barcodes, invoices, Markdown, hashing, JWT, validators, i18n and a Japanese pack — 80 endpoints in total. Deterministic, fast and cheap. Start free on the BASIC plan.
- **File:** `spotlight-1-en.pdf` (or `banner-overview.png`)

### Spotlight 2 — Japanese pack (differentiator)
- **Title:** 🇯🇵 Built for Japanese apps
- **Description:** Full-width⇄half-width, hiragana⇄katakana, kana→romaji and romaji slugs — niche but essential Japanese text utilities you won't find elsewhere.
- **File:** `spotlight-2-en.pdf` (or `banner-japanese.png`)

### Spotlight 3 — Codes & documents
- **Title:** QR, barcodes & documents in one call
- **Description:** QR codes (incl. Wi-Fi & vCard), Code128/EAN/UPC/ITF/DataMatrix/PDF417, SVG invoices with auto-computed totals, and Markdown→sanitized HTML. Output as PNG or SVG.
- **File:** `spotlight-3-en.pdf` (or `banner-codes.png`)

### Spotlight 4 — Validators
- **Title:** Validate everything
- **Description:** Email, credit card (Luhn), IBAN (mod-97), phone (E.164), postal codes, password strength — plus PII redaction. All your input validation behind one API.
- **File:** `spotlight-4-en.pdf` (or `banner-validate.png`)

---

# 6. Discussions (first post)

> Create one "Welcome" discussion to add activity and boost SEO/trust.

```markdown
**Title:** Welcome 👋 — Getting started & feature requests

Thanks for checking out Toolbelt API! 80 deterministic, zero-AI-cost utilities
behind one base URL.

- New here? Subscribe to the free **BASIC** plan and try `GET /v1/uuid` or `POST /v1/qr`.
- Full interactive docs are in the **Endpoints** tab.
- Missing a utility you need? Reply here — we ship requested endpoints quickly.

Happy building!
```

---

# 7. Where to put each piece

| Content | Location (RapidAPI) |
|---|---|
| Name / Short / Long description | General tab |
| Getting Started | About (or top of Long Description) |
| Each Tutorial | Tutorials tab → New Tutorial → paste body |
| Spotlights | Overview tab → Add Spotlight (title + description + EN PDF) |
| Discussion | Discussions tab → New Discussion |
| Pricing plans | Plans / Pricing tab |

> Replace `{HOST}` with this listing's `X-RapidAPI-Host` (shown in the Hub code
> snippets). Reviews and ratings accumulate per listing, so the JP and EN
> listings build SEO independently in their respective markets.
