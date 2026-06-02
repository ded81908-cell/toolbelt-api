# RapidAPI 掲載コンテンツ（About / Tutorials / Getting Started）

RapidAPI の Hub Listing にある **About** / **Tutorials** タブへ、そのまま貼り付けて使えるコンテンツ集です（Markdown対応）。
JP（日本向け出品）と EN（グローバル出品）の両方を用意しています。コード例の `{HOST}`（例: `toolbelt-api.p.rapidapi.com`）と `YOUR_KEY` は各自の値に置き換えてください。

---

# 1. Getting Started / はじめに

## 【JP】はじめかた（3ステップ）

```markdown
## はじめかた

**1. プランに登録**
RapidAPIでお好みのプラン（まずは無料のBASIC）をSubscribeします。

**2. APIキーを取得**
登録すると `X-RapidAPI-Key` が発行されます。全リクエストにこのヘッダを付けます。

**3. 最初のリクエスト**
\`\`\`bash
curl -X POST "https://{HOST}/v1/qr" \
  -H "X-RapidAPI-Key: YOUR_KEY" \
  -H "X-RapidAPI-Host: {HOST}" \
  -H "Content-Type: application/json" \
  -d '{"text":"https://example.com","format":"png","size":512}' \
  --output qr.png
\`\`\`

これでQRコードのPNGが返ります。すべてのエンドポイントは **Endpoints タブ**で対話的に試せます。

- 認証：`X-RapidAPI-Key` ヘッダ（RapidAPIが自動付与）
- レスポンス：JSON または画像（PNG/SVG）
- 失敗時：`4xx` とJSONのエラーメッセージ
```

## 【EN】Getting Started (3 steps)

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

That returns a PNG QR code. Try any of the 59 endpoints interactively in the **Endpoints** tab.

- Auth: `X-RapidAPI-Key` header (added by RapidAPI)
- Responses: JSON or images (PNG/SVG)
- Errors: `4xx` with a JSON error message
```

---

# 2. About / Spotlight 紹介文

## 【JP】短い紹介（Spotlight/ハイライト用）

```markdown
**Toolbelt API** は、アプリ開発で頻出する「地味だけど必要」な処理を1つにまとめた高速ユーティリティAPIです。QR・バーコード・請求書・Markdown・ハッシュ・データ変換に加え、**日本語処理（全角半角・かな・ローマ字）** や **国際化（翻字・電話・郵便番号・通貨）**、開発ツール（JWT・色・単位・正規表現的検証）まで59エンドポイント。**AI不使用**なので低コスト・高速・結果が安定。まずは無料プランでどうぞ。
```

## 【EN】Short pitch (Spotlight/highlight)

```markdown
**Toolbelt API** bundles the boring-but-essential utilities every app needs into one fast service: QR & barcodes, invoices, Markdown→HTML, hashing, data conversion, plus full **internationalisation** (transliteration, phone, postal, currency), a **Japanese** text pack, and dev tools (JWT, colour, units, validators) — 59 endpoints in total. **No AI/inference cost**, so it's cheap, fast and deterministic. Start free.
```

---

# 3. Tutorials（チュートリアル記事）

> RapidAPI の **Tutorials** タブで「New Tutorial」を作り、各記事の本文に下記をコピペしてください。

## Tutorial 1 — QRコード生成 / Generate a QR code

```markdown
### QRコードを生成する / Generate a QR code

`POST /v1/qr` にテキストとオプションを渡すと、QRコードを PNG または SVG で返します。

**Request**
\`\`\`json
{ "text": "https://example.com", "format": "png", "size": 512, "ecc": "M" }
\`\`\`

**curl**
\`\`\`bash
curl -X POST "https://{HOST}/v1/qr" \
  -H "X-RapidAPI-Key: YOUR_KEY" -H "X-RapidAPI-Host: {HOST}" \
  -H "Content-Type: application/json" \
  -d '{"text":"https://example.com","format":"svg"}'
\`\`\`

**Tips**
- `format`: `png`（既定）または `svg`
- `ecc`: 誤り訂正レベル `L/M/Q/H`
- 大量に作るなら `POST /v1/qr/bulk`（1回で最大200件）
- Wi-Fi接続用は `POST /v1/qr/wifi`、連絡先は `POST /v1/qr/vcard`
```

## Tutorial 2 — 日本語テキスト処理 / Japanese text

```markdown
### 日本語テキストを正規化・ローマ字化する / Normalize & romanize Japanese

`POST /v1/jp/convert` は全角半角変換・かな変換・ローマ字化を行います。

**全角→半角**
\`\`\`bash
curl -X POST "https://{HOST}/v1/jp/convert" \
  -H "X-RapidAPI-Key: YOUR_KEY" -H "X-RapidAPI-Host: {HOST}" \
  -H "Content-Type: application/json" \
  -d '{"text":"ＡＢＣ１２３","operation":"hankaku"}'
# → {"operation":"hankaku","result":"ABC123"}
\`\`\`

**ローマ字化**
\`\`\`bash
-d '{"text":"とうきょう","operation":"romaji"}'
# → {"result":"toukyou"}
\`\`\`

`operation`: `hankaku` / `zenkaku` / `hiragana` / `katakana` / `romaji`。
URL用スラッグは `POST /v1/jp/slug`（例：東京タワー → tokyotawa）。
```

## Tutorial 3 — 請求書を作る / Build an invoice

```markdown
### 請求書（SVG）を生成する / Generate an invoice

`POST /v1/invoice` に明細を渡すと、小計・税・合計を自動計算した印刷可能なSVGを返します。

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

返ってくるSVGはブラウザでそのまま表示・印刷（PDF化）できます。多通貨対応（`currency` / `locale`）。
```

## Tutorial 4 — 電話番号の検証・整形 / Validate & format phone numbers

```markdown
### 電話番号を検証・整形する / Validate & format phone numbers

`POST /v1/phone` は国際対応の電話番号パーサ（libphonenumberベース）です。

\`\`\`bash
curl -X POST "https://{HOST}/v1/phone" \
  -H "X-RapidAPI-Key: YOUR_KEY" -H "X-RapidAPI-Host: {HOST}" \
  -H "Content-Type: application/json" \
  -d '{"number":"03-1234-5678","country":"JP"}'
\`\`\`

**Response**
\`\`\`json
{ "valid": true, "e164": "+81312345678",
  "national": "03-1234-5678", "international": "+81 3 1234 5678",
  "country": "JP", "type": "fixed_line" }
\`\`\`

郵便番号は `POST /v1/postal`、通貨換算は `POST /v1/currency/convert` も合わせてどうぞ。
```

---

# 4. 配置のしかた（どこに貼るか）

| コンテンツ | 貼る場所（RapidAPI） |
|---|---|
| Getting Started / About 紹介文 | Hub Listing の **About**（または General の Long Description） |
| 各 Tutorial | **Tutorials** タブ → New Tutorial → 本文に貼り付け |
| Spotlight 短文 | ハイライト/紹介枠があればそこへ（無ければ About 冒頭に） |

> `{HOST}` は各出品の `X-RapidAPI-Host`（Hubのコードスニペットに表示）に置き換えてください。
> JP出品にはJP版、グローバル出品にはEN版を使うと刺さります。
