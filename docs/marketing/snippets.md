# Copy-paste snippets (embed in any article/post)

Working examples readers can run immediately. Replace `{HOST}` and `{KEY}`.

---

## curl

```bash
# QR code (SVG)
curl -X POST "https://{HOST}/v1/qr" \
  -H "X-RapidAPI-Key: {KEY}" -H "X-RapidAPI-Host: {HOST}" \
  -H "Content-Type: application/json" \
  -d '{"text":"https://example.com","format":"svg"}' > qr.svg

# SHA-256 hash
curl -X POST "https://{HOST}/v1/hash" \
  -H "X-RapidAPI-Key: {KEY}" -H "X-RapidAPI-Host: {HOST}" \
  -H "Content-Type: application/json" \
  -d '{"input":"hello","algorithm":"sha256"}'

# Japanese: full-width -> half-width
curl -X POST "https://{HOST}/v1/jp/convert" \
  -H "X-RapidAPI-Key: {KEY}" -H "X-RapidAPI-Host: {HOST}" \
  -H "Content-Type: application/json" \
  -d '{"text":"ＡＢＣ１２３","operation":"hankaku"}'
```

## JavaScript (fetch)

```js
const BASE = "https://{HOST}";
const headers = {
  "X-RapidAPI-Key": "{KEY}",
  "X-RapidAPI-Host": "{HOST}",
  "Content-Type": "application/json",
};

// JSON endpoint
const r = await fetch(`${BASE}/v1/validate/email`, {
  method: "POST", headers,
  body: JSON.stringify({ email: "test@example.com" }),
});
console.log(await r.json());

// Image endpoint -> Blob
const img = await fetch(`${BASE}/v1/qr`, {
  method: "POST", headers,
  body: JSON.stringify({ text: "https://example.com", format: "png" }),
});
const blob = await img.blob(); // use as <img> src or save
```

## Python (requests)

```python
import requests

BASE = "https://{HOST}"
HEADERS = {
    "X-RapidAPI-Key": "{KEY}",
    "X-RapidAPI-Host": "{HOST}",
    "Content-Type": "application/json",
}

# JSON
r = requests.post(f"{BASE}/v1/jwt/sign", headers=HEADERS,
    json={"payload": {"sub": "123"}, "secret": "s3cret", "alg": "HS256"})
print(r.json()["token"])

# Image -> file
img = requests.post(f"{BASE}/v1/qr", headers=HEADERS,
    json={"text": "https://example.com", "format": "png"})
open("qr.png", "wb").write(img.content)
```

## Node (axios)

```js
import axios from "axios";
const api = axios.create({
  baseURL: "https://{HOST}",
  headers: { "X-RapidAPI-Key": "{KEY}", "X-RapidAPI-Host": "{HOST}" },
});

const { data } = await api.post("/v1/currency/convert", {
  from: "USD", to: "JPY", amount: 100,
});
console.log(data);
```

---

## One-liner pitches (for captions / link previews)

- EN: "80 dev utilities in one API — QR, invoices, JWT, validators, i18n. No AI cost."
- JP: "開発の地味タスク80個を1つのAPIに。QR・請求書・JWT・検証・日本語処理。AIコストゼロ。"
