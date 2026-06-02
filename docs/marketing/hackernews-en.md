# Hacker News — Show HN

> High risk / high reward. HN dislikes marketing. Be plain, technical, humble.
> Title MUST start with "Show HN:". Be online to answer comments for hours.
> Don't use emoji. Don't exaggerate. Link to the live docs, not a paywall.

Replace `{EN_LISTING}` / `{HOST}` before posting.

---

## Title (≤80 chars)
```
Show HN: Toolbelt API – 80 small dev utilities (QR, invoices, JWT, i18n) in one API
```

## URL
```
{EN_LISTING}
```
(or link directly to the live Swagger docs: https://toolbelt-api-9oll.onrender.com/docs)

## First comment (the "why")
```
I built this because I kept adding a dependency for every small, repetitive task:
QR codes, hashing, UUIDs, invoices, email/IBAN validation, JWTs. It's one REST API
with 80 endpoints, no AI/inference involved, so results are deterministic and the
marginal cost is near zero.

Stack: Fastify + TypeScript, OpenAPI 3.0, Docker on Render, fronted by RapidAPI for
keys/metering/billing. Auth is a single header; responses are JSON or images
(PNG/SVG). Everything is interactive at /docs.

The one non-commodity piece is a Japanese text pack (full-width<->half-width, kana,
kana->romaji) which I couldn't find cleanly elsewhere.

Things I'm unsure about and would value HN's take on:
- Is "many small utilities behind one API" actually useful, or do people just
  vendor a library?
- Pricing model for zero-marginal-cost APIs — generous free tier vs. conversion.

Happy to answer anything technical.
```

> Note: expect blunt feedback. Engage genuinely; don't get defensive. Even a
> mid-ranking Show HN drives meaningful traffic and a few quality signups.
