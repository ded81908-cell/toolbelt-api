# Product Hunt launch kit

> Launch Tue–Thu, 00:01 PT for a full day of votes. Have 3–5 friends ready to
> comment (not just upvote). Reply to every comment fast.

Replace `{EN_LISTING}` before launching.

---

## Name
```
Toolbelt API
```

## Tagline (≤60 chars)
```
80 dev utilities in one API — QR, invoices, JWT, i18n
```

Alternatives:
```
One API for the boring dev tasks. No AI, no cost bloat.
```
```
QR, barcodes, invoices, JWT & Japanese text — one API
```

## Topics / tags
```
Developer Tools, APIs, No-Code, Productivity
```

## Description (first comment from maker)
```
Hi PH 👋

I kept adding a new dependency for every small task — QR codes, hashing,
invoices, email/IBAN validation, JWTs — so I bundled 80 of them into one API.

Toolbelt API is:
• Deterministic — no AI/inference, same input → same output
• Fast & cheap — almost all margin, so the free tier can be generous
• One header auth, JSON or image (PNG/SVG) responses

Highlights:
• QR & barcodes (incl. Wi-Fi-join & vCard)
• Invoices (SVG, totals auto-computed) + Markdown→HTML
• JWT/bcrypt, hashing, UUID/ULID
• Validators: email, credit card (Luhn), IBAN (mod-97), phone (E.164)
• i18n: transliteration, postal codes, currency
• 🇯🇵 Japanese text pack: full-width⇄half-width, kana, romaji (the niche bit)

Free tier to try: {EN_LISTING}

I'd love feedback — and I ship requested endpoints quickly, so tell me what's
missing from your toolbelt!
```

## Gallery assets (already in the repo)
- `public/brand/banners/banner-overview.png`
- `public/brand/banners/banner-codes.png`
- `public/brand/banners/banner-japanese.png`
- `public/brand/banners/banner-validate.png`
- `public/brand/logo-1024.png`

## Maker comment prompts (seed the discussion)
- "What endpoint should I add next?"
- "Anyone else annoyed by full-width/half-width input from Japanese users?"
- "Happy to share the architecture (Fastify + Render + RapidAPI) if useful."
