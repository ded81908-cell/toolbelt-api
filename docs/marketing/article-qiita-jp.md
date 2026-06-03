# 【Qiita投稿用】日本語処理を1リクエストで：全角半角・かな・ローマ字・QR・請求書まで叩けるAPIを作った

> タグ候補: `API` `JavaScript` `Python` `日本語処理` `個人開発`

---

## はじめに

アプリ開発をしていると、「地味だけど毎回必要」な処理が無限に出てきます。

- 全角の `ＡＢＣ１２３` を半角 `ABC123` に直したい
- ひらがな⇄カタカナ、かな→ローマ字スラッグにしたい
- QRコードやバーコードを生成したい
- 請求書（PDF/SVG）を作りたい
- ハッシュ・JWT・UUID・バリデーション……

毎回ライブラリを探して、依存を増やして、メンテして……正直しんどい。
そこで **これらを1本のAPIにまとめた [Toolbelt API](（https://rapidapi.com/ded81908cell/api/toolbelt-api-Kai-Fa-Zhe-Xiang-keyuteiritei）)** を作りました。AI不使用なので高速・低コスト・結果が安定（決定的）です。

この記事では、特に**日本語処理**を中心に使い方を紹介します。

---

## まず叩いてみる（全角→半角）

RapidAPI経由で叩くだけ。認証は `X-RapidAPI-Key` ヘッダ1つ。

```bash
curl -X POST "https://toolbelt-api-9oll.onrender.com/v1/jp/convert" \
  -H "X-RapidAPI-Key: {KEY}" \
  -H "X-RapidAPI-Host: toolbelt-api-9oll.onrender.com" \
  -H "Content-Type: application/json" \
  -d '{"text":"ＡＢＣ１２３","operation":"hankaku"}'
```

```json
{ "operation": "hankaku", "result": "ABC123" }
```

`operation` を変えるだけで色々できます：

| operation | 例 | 結果 |
|---|---|---|
| `hankaku` | `ＡＢＣ１２３` | `ABC123` |
| `zenkaku` | `ABC123` | `ＡＢＣ１２３` |
| `hiragana` | `カタカナ` | `かたかな` |
| `katakana` | `ひらがな` | `ヒラガナ` |
| `romaji` | `とうきょう` | `toukyou` |

---

## URL用スラッグも一発

日本語タイトルからURLスラッグを作るのは地味に面倒ですが、これも1リクエスト。

```bash
curl -X POST "https://toolbelt-api-9oll.onrender.com/v1/jp/slug" \
  -H "X-RapidAPI-Key: {KEY}" -H "X-RapidAPI-Host: toolbelt-api-9oll.onrender.com" \
  -H "Content-Type: application/json" \
  -d '{"text":"東京タワーの夜景"}'
# → {"slug":"tokyotawanoyakei"}
```

ブログCMSやEC商品ページのスラッグ自動生成に便利です。

---

## JavaScript から使う

```js
const res = await fetch("https://toolbelt-api-9oll.onrender.com/v1/jp/convert", {
  method: "POST",
  headers: {
    "X-RapidAPI-Key": "{KEY}",
    "X-RapidAPI-Host": "toolbelt-api-9oll.onrender.com",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ text: "ＡＢＣ１２３", operation: "hankaku" }),
});
const data = await res.json();
console.log(data.result); // "ABC123"
```

## Python から使う

```python
import requests

r = requests.post(
    "https://toolbelt-api-9oll.onrender.com/v1/jp/convert",
    headers={
        "X-RapidAPI-Key": "{KEY}",
        "X-RapidAPI-Host": "toolbelt-api-9oll.onrender.com",
        "Content-Type": "application/json",
    },
    json={"text": "とうきょう", "operation": "romaji"},
)
print(r.json()["result"])  # "toukyou"
```

---

## 日本語以外も80エンドポイント

日本語処理はほんの一部。同じBase URL・同じキーで以下も使えます：

- **QR / バーコード**：`/v1/qr`（Wi-Fi・vCard対応）、`/v1/barcode`（Code128/EAN/UPC/PDF417）
- **書類**：`/v1/invoice`（税込合計を自動計算したSVG）、`/v1/markdown`（→サニタイズ済みHTML）
- **データ**：`/v1/convert`（JSON⇄YAML⇄CSV）、`/v1/json/format`、`/v1/hash`
- **認証**：`/v1/jwt/decode` `/v1/jwt/sign` `/v1/bcrypt/hash`
- **検証**：`/v1/validate/email` `/creditcard`（Luhn）`/iban`（mod-97）
- **国際化**：`/v1/phone`（E.164）`/v1/postal` `/v1/currency/convert`

全エンドポイントは Swagger UI で対話的に試せます。

---

## 料金

- **無料プラン**あり（まずはこれで試せます）
- 有料は月額＋従量（AI不使用なので安い）

---

## まとめ

「全角半角・かな・ローマ字」みたいな**日本語特有の処理を外部APIに逃がせる**のは、地味に効きます。依存を増やさず、メンテも不要。

気になった方はぜひ無料プランで叩いてみてください 👉 **https://rapidapi.com/ded81908cell/api/toolbelt-api-Kai-Fa-Zhe-Xiang-keyuteiritei**

フィードバック・「こんな機能欲しい」も歓迎です。コメントください！
