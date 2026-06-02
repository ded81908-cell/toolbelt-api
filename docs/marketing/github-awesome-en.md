# GitHub distribution (durable backlinks + SEO)

Free, evergreen traffic. Lower effort, compounding returns.

Replace `{EN_LISTING}` before submitting.

---

## 1. Submit to "awesome" / public-API lists

Open a PR adding one line to these curated lists (check each repo's
CONTRIBUTING + alphabetical ordering rules first):

- `public-apis/public-apis` — the big one
- `public-api-lists/public-api-lists`
- `marcelscruz/public-apis`
- `n0shake/Public-APIs`
- `TonnyL/Awesome_APIs`

**Suggested entry (Development / Tools section):**
```
| Toolbelt API | 80 developer utilities: QR & barcodes, invoices, JWT, hashing, UUID, validators, i18n & Japanese text | `apiKey` | Yes | Yes |
```
or markdown list style:
```
- [Toolbelt API]({EN_LISTING}) — 80 dev utilities (QR, barcodes, invoices, JWT, hashing, validators, i18n, Japanese text). No AI cost.
```

> PRs to `public-apis` are heavily moderated. Follow the exact table format,
> keep the description short, and make sure the link works.

## 2. Make the repo discoverable

- Add GitHub **topics**: `api`, `rest-api`, `developer-tools`, `qr-code`,
  `barcode`, `invoice`, `jwt`, `i18n`, `japanese`, `utilities`, `fastify`,
  `typescript`.
- Pin the repo on your profile.
- Add a clear "Use the hosted API" + "Self-host with Docker" section to the README
  (already present) with the RapidAPI link near the top.

## 3. Tiny example repos (each is a backlink)

Create small companion repos that solve one real task using the API:
- `toolbelt-qr-demo` (Node) — "Generate QR codes from a CSV"
- `toolbelt-invoice-demo` (Python) — "Turn a JSON order into an SVG/PDF invoice"
- `toolbelt-japanese-demo` (JS) — "Normalize Japanese form input"

Each README links back to `{EN_LISTING}`. These rank for long-tail queries.

## 4. StackOverflow / community answers

When you genuinely answer a relevant question (e.g. "how to convert full-width to
half-width in X language"), you can mention the API as one option — only where it
actually helps. Don't spam; one good answer beats ten links.
