---
title: "I bundled 80 boring-but-essential dev utilities into one API (QR, invoices, JWT, i18n, Japanese text)"
published: true
tags: api, webdev, javascript, python
---

> Dev.to / Hashnode / Medium. The frontmatter works on Dev.to as-is.
> Replace `{...}` placeholders before publishing.

Every app needs the same dull little jobs: generate a QR code, hash a string,
validate an email, format some JSON, build an invoice. I got tired of pulling a
new dependency for each one, so I put **80 of them behind a single API**:
[Toolbelt API](https://rapidapi.com/ded81908cell/api/toolbelt-api-qr-code-invoice-json-jwt-i18n-utilities).

No AI, no inference cost — so it's **fast, cheap and deterministic** (same input,
same output, every time).

## One key, one base URL

Auth is a single header. Here's a QR code:

```bash
curl -X POST "https://toolbelt-api-9oll.onrender.com/v1/qr" \
  -H "X-RapidAPI-Key: {KEY}" \
  -H "X-RapidAPI-Host: toolbelt-api-9oll.onrender.com" \
  -H "Content-Type: application/json" \
  -d '{"text":"https://example.com","format":"svg"}' > qr.svg
```

## A few favourites

**Validate anything**
```bash
-d '{"value":"DE89370400440532013000"}'   # POST /v1/validate/iban -> {"valid":true,...}
```

**Sign a JWT**
```bash
-d '{"payload":{"sub":"123"},"secret":"s3cret","alg":"HS256"}'  # POST /v1/jwt/sign
```

**Convert data formats**
```bash
-d '{"from":"json","to":"yaml","data":"{\"a\":1}"}'             # POST /v1/convert
```

**Build an invoice (SVG, totals auto-computed)**
```bash
-d '{"number":"INV-001","currency":"USD","taxRate":10,
     "from":{"name":"My Co."},"to":{"name":"Client"},
     "items":[{"description":"Service","quantity":2,"unitPrice":100}]}'  # POST /v1/invoice
```

## The differentiator: a Japanese text pack 🇯🇵

This is the part you won't easily find elsewhere — full-width⇄half-width,
hiragana⇄katakana, and kana→romaji:

```bash
-d '{"text":"とうきょう","operation":"romaji"}'   # POST /v1/jp/convert -> {"result":"toukyou"}
```

If you build anything for Japanese users (e-commerce, forms, search), normalising
full-width/half-width input alone saves a surprising amount of pain.

## Use it from code

```js
const res = await fetch("https://toolbelt-api-9oll.onrender.com/v1/hash", {
  method: "POST",
  headers: {
    "X-RapidAPI-Key": "{KEY}",
    "X-RapidAPI-Host": "toolbelt-api-9oll.onrender.com",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ input: "hello", algorithm: "sha256" }),
});
console.log((await res.json()).hash);
```

```python
import requests
r = requests.post("https://toolbelt-api-9oll.onrender.com/v1/qr",
    headers={"X-RapidAPI-Key":"{KEY}","X-RapidAPI-Host":"toolbelt-api-9oll.onrender.com"},
    json={"text":"https://example.com","format":"png"})
open("qr.png","wb").write(r.content)
```

## What's inside (80 endpoints)

QR & barcodes · invoices · Markdown→HTML · JSON/YAML/CSV · hashing · JWT · bcrypt ·
UUID/ULID/NanoID · email/IBAN/credit-card validation · phone (E.164) · postal codes ·
currency · color/contrast · units · timezones · geo distance · CIDR · regex tester ·
user-agent parser · PII redaction · and the Japanese pack.

## Try it

There's a free tier — kick the tyres here 👉 **https://rapidapi.com/ded81908cell/api/toolbelt-api-qr-code-invoice-json-jwt-i18n-utilities**

If a utility you need is missing, drop a comment. I ship requested endpoints fast.
