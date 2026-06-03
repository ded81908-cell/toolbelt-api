# LinkedIn posts

Developer-audience B2B tone. More professional than X, longer is fine.
One post = one block. Replace URLs if needed (already embedded).

---

## A. 個人開発ローンチ投稿（JP）

```
開発の「地味タスク」80個をAPIにまとめました。

QRコード・バーコード・請求書・JSON変換・ハッシュ・JWT・UUID・メール/IBAN/カード検証・電話番号整形・日本語処理（全角半角・かな・ローマ字）……

毎回ライブラリを探して追加してメンテするより、HTTP1本で済む方が楽だと思って作りました。AI不使用なので高速・低コスト・結果が安定。

無料プランあり👇
https://rapidapi.com/ded81908cell/api/toolbelt-api-Kai-Fa-Zhe-Xiang-keyuteiritei

「こんな機能が欲しい」があればコメントください。要望ベースでどんどん追加していきます。

#個人開発 #API #SideProject #日本語処理
```

---

## B. Launch post (EN)

```
I just launched Toolbelt API — 80 developer utilities behind a single REST API.

The idea: stop pulling a new library for every small, repetitive task.

What's inside:
→ QR codes & barcodes (Code128/EAN/UPC/PDF417, PNG or SVG)
→ Invoices (SVG, totals auto-computed)
→ JWT sign/decode, bcrypt, SHA hashing
→ Email, IBAN, credit card (Luhn) validators
→ UUID/ULID/NanoID generators
→ Phone (E.164), postal codes, currency
→ JSON/YAML/CSV conversion
→ 🇯🇵 Japanese text: full-width⇄half-width, kana, romaji (rare elsewhere)

No AI/inference → fast, deterministic, cheap. Free tier to start.

Would love feedback from anyone building developer tools or SaaS.
👉 https://rapidapi.com/ded81908cell/api/toolbelt-api-qr-code-invoice-json-jwt-i18n-utilities

#DeveloperTools #API #SideProject #SaaS #IndieHacker
```

---

## C. Value-angle post (EN — works as a follow-up 1 week later)

```
A pattern I see in almost every web app codebase:

5–10 tiny utility functions scattered around:
• "normalize full-width input before saving"
• "generate a QR code for the order page"
• "validate the IBAN before submitting"
• "hash this for the audit log"

Each one pulled in a different library. Each library needs updates.

What if they were all one HTTP call?

That's exactly what I built with Toolbelt API. 80 of these utilities, one key.
Free tier: https://rapidapi.com/ded81908cell/api/toolbelt-api-qr-code-invoice-json-jwt-i18n-utilities

Curious — how do you handle these in your stack?

#WebDev #APIDesign #DeveloperExperience
```
