# コード例（curl / JavaScript / Python）

RapidAPI 経由の呼び出し例。`X-RapidAPI-Key` と `X-RapidAPI-Host` は RapidAPI が発行する値に置き換えてください。
自前ホスト（直販）で叩く場合は、ヘッダを `X-API-Key: <your-key>` 一つに置き換えれば同じです。

```
BASE = https://<your-rapidapi-host>     # 例: toolbelt-api.p.rapidapi.com
HEADERS:
  X-RapidAPI-Key:  <YOUR_KEY>
  X-RapidAPI-Host: <your-rapidapi-host>
  Content-Type:    application/json
```

---

## QR コード（PNG）

**curl**
```bash
curl -X POST "https://$BASE/v1/qr" \
  -H "X-RapidAPI-Key: $KEY" -H "X-RapidAPI-Host: $BASE" \
  -H "Content-Type: application/json" \
  -d '{"text":"https://example.com","format":"png","size":512}' \
  --output qr.png
```

**JavaScript (fetch)**
```js
const res = await fetch(`https://${BASE}/v1/qr`, {
  method: "POST",
  headers: {
    "X-RapidAPI-Key": KEY,
    "X-RapidAPI-Host": BASE,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ text: "https://example.com", format: "png", size: 512 }),
});
const pngBuffer = Buffer.from(await res.arrayBuffer());
```

**Python (requests)**
```python
import requests
r = requests.post(
    f"https://{BASE}/v1/qr",
    headers={"X-RapidAPI-Key": KEY, "X-RapidAPI-Host": BASE},
    json={"text": "https://example.com", "format": "png", "size": 512},
)
open("qr.png", "wb").write(r.content)
```

---

## バーコード（EAN-13, PNG）

```bash
curl -X POST "https://$BASE/v1/barcode" \
  -H "X-RapidAPI-Key: $KEY" -H "X-RapidAPI-Host: $BASE" \
  -H "Content-Type: application/json" \
  -d '{"type":"ean13","text":"4006381333931"}' --output barcode.png
```

---

## 日本語変換（全角→半角）

```bash
curl -X POST "https://$BASE/v1/jp/convert" \
  -H "X-RapidAPI-Key: $KEY" -H "X-RapidAPI-Host: $BASE" \
  -H "Content-Type: application/json" \
  -d '{"text":"ＡＢＣ１２３","operation":"hankaku"}'
# {"operation":"hankaku","result":"ABC123"}
```

```python
import requests
r = requests.post(
    f"https://{BASE}/v1/jp/convert",
    headers={"X-RapidAPI-Key": KEY, "X-RapidAPI-Host": BASE},
    json={"text": "とうきょう", "operation": "romaji"},
)
print(r.json())  # {"operation": "romaji", "result": "toukyou"}
```

---

## 請求書（SVG）

```js
const res = await fetch(`https://${BASE}/v1/invoice`, {
  method: "POST",
  headers: { "X-RapidAPI-Key": KEY, "X-RapidAPI-Host": BASE, "Content-Type": "application/json" },
  body: JSON.stringify({
    number: "INV-001", date: "2026-06-01", currency: "USD", taxRate: 10,
    from: { name: "My Co." }, to: { name: "Client" },
    items: [{ description: "Service", quantity: 2, unitPrice: 100 }],
  }),
});
const svg = await res.text();
```

---

## 通貨換算（オフライン：レート指定）

```bash
curl -X POST "https://$BASE/v1/currency/convert" \
  -H "X-RapidAPI-Key: $KEY" -H "X-RapidAPI-Host: $BASE" \
  -H "Content-Type: application/json" \
  -d '{"from":"USD","to":"JPY","amount":10,"base":"USD","rates":{"JPY":150}}'
# {"from":"USD","to":"JPY","amount":10,"result":1500,"source":"provided"}
```

---

## JWT デコード（+ HMAC 検証）

```python
import requests
r = requests.post(
    f"https://{BASE}/v1/jwt/decode",
    headers={"X-RapidAPI-Key": KEY, "X-RapidAPI-Host": BASE},
    json={"token": "<jwt>", "secret": "<hmac-secret>"},
)
print(r.json())  # header, payload, expired, signatureValid
```

---

## 単位変換 / バリデーション

```bash
# km -> mi
curl -s -X POST "https://$BASE/v1/units/convert" \
  -H "X-RapidAPI-Key: $KEY" -H "X-RapidAPI-Host: $BASE" -H "Content-Type: application/json" \
  -d '{"value":42.195,"from":"km","to":"mi"}'

# メール検証 & 正規化
curl -s -X POST "https://$BASE/v1/validate/email" \
  -H "X-RapidAPI-Key: $KEY" -H "X-RapidAPI-Host: $BASE" -H "Content-Type: application/json" \
  -d '{"email":"John.Doe+x@Gmail.com"}'
# {"valid":true,"normalized":"johndoe@gmail.com"}
```

---

> 全エンドポイントの正確なスキーマ・必須項目は、デプロイ先の `/docs`（Swagger UI）で対話的に確認できます。
