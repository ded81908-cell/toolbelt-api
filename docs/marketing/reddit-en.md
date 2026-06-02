# Reddit posts (English)

> Reddit hates ads. Tone = "I built this, would love feedback", not "buy my API".
> Post to ONE subreddit at a time. Reply to every comment. Read each sub's rules
> (some require a self-promo flair or limit links).

Replace `{EN_LISTING}` before posting.

---

## r/SideProject  (best fit — launches welcome)

**Title:**
```
I built an API that bundles 80 boring dev utilities (QR, invoices, JWT, i18n) so I stop adding a dependency for every tiny task
```

**Body:**
```
I kept pulling a new library every time I needed a QR code, a hash, an invoice,
an email/IBAN check, a JWT… so I put 80 of these behind one API.

No AI/inference, so it's fast, cheap and deterministic (same input → same output).

A few examples:
- POST /v1/qr → QR as PNG/SVG (also Wi-Fi-join and vCard QR)
- POST /v1/invoice → printable SVG invoice with totals computed
- POST /v1/validate/iban → mod-97 check
- POST /v1/jwt/sign → HS256/384/512
- POST /v1/jp/convert → Japanese full-width⇄half-width, kana, romaji (the niche bit)

Free tier if you want to poke at it: {EN_LISTING}

Honest question for this sub: which utility would make you actually reach for
something like this? Happy to add requested endpoints.
```

---

## r/webdev  (use the daily/weekly "Showoff" or "I made this" thread if required)

**Title:**
```
One API for the repetitive stuff: QR, barcodes, invoices, hashing, JWT, validators, i18n
```

**Body:**
```
Sharing a side project: a single REST API with 80 small utilities so you don't
have to wire up a library per task.

Auth is one header; responses are JSON or images (PNG/SVG). Examples:

  curl -X POST ".../v1/hash" -H "X-RapidAPI-Key: KEY" \
    -d '{"input":"hello","algorithm":"sha256"}'

Covers QR/barcodes, invoices, Markdown→HTML, JSON/YAML/CSV, JWT/bcrypt,
UUID/ULID, email/card/IBAN validation, phone (E.164), currency, plus a Japanese
text pack. No AI cost.

Free tier: {EN_LISTING}
Feedback + endpoint requests very welcome.
```

---

## r/japanlife or r/LearnJapanese (only if relevant; lead with the JP angle)

**Title:**
```
Made an API for Japanese text normalization (full-width⇄half-width, kana, romaji)
```

**Body:**
```
If you build apps for Japanese users, normalizing full-width/half-width input and
converting kana→romaji is a recurring chore. I wrapped it in a simple API:

  POST /v1/jp/convert  {"text":"ＡＢＣ","operation":"hankaku"} → "ABC"
  POST /v1/jp/convert  {"text":"とうきょう","operation":"romaji"} → "toukyou"
  POST /v1/jp/slug     {"text":"東京タワー"} → "tokyotawa"

It's part of a larger utility API (QR, invoices, validators…), free tier here:
{EN_LISTING}. Curious if others hit the same pain.
```
