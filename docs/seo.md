# SEO コピー強化（RapidAPI 検索最適化）

RapidAPI / Google の検索は **API名 + 説明文中のキーワード + カテゴリ + レビュー/利用数** で順位が決まります。
ここでは「開発者が実際に検索する語」を埋め込んだ、コピペ用の最適化テキストをまとめます。

> ポイント：英語キーワードは**日本向け出品でも**入れる価値があります（検索語の多くは英語のため）。

---

## 1. 最適化したAPI名（タイトル）

タイトルは最も強い検索シグナル。**主要キーワードを名前に含める**のが効果的です。

**JP出品（候補）**
```
Toolbelt API — QRコード・バーコード・請求書・日本語処理・国際化ユーティリティ
```

**グローバル出品（候補）**
```
Toolbelt API — QR Code, Barcode, Invoice, JSON, JWT & i18n Utilities
```

> 長すぎる場合は前半（主要語）を優先。スラッグが汚い場合もここを英語にすると改善します。

---

## 2. Short description（キーワード凝縮版）

**EN（≈150字）**
```
80 developer utilities in one API: QR code & barcode generator, invoice (SVG) & PDF-ready Markdown, JSON formatter, hashing, JWT, bcrypt, UUID, email/IBAN/credit-card validation, phone & currency, plus a Japanese text toolkit. Fast, deterministic, no AI cost.
```

**JP（≈140字）**
```
QRコード・バーコード生成、請求書、Markdown→HTML、JSON整形、ハッシュ、JWT、bcrypt、UUID、メール/IBAN/カード検証、電話・通貨、そして日本語処理（全角半角・かな・ローマ字）まで80機能を1つのAPIに。高速・安定・AIコストゼロ。
```

---

## 3. Long description 冒頭（キーワード密度を上げる導入）

**EN**
```
Toolbelt API is a fast, deterministic developer-utility REST API. Generate QR codes
and barcodes (Code128, EAN, UPC, PDF417), render invoices and Markdown to HTML,
format and validate JSON, hash and sign data (SHA, MD5, HMAC, JWT, bcrypt), create
UUIDs/ULIDs, validate emails, IBANs and credit cards, parse phone numbers (E.164),
convert units, timezones and currencies, and process Japanese text — all behind one
endpoint, with no AI/inference cost.
```

---

## 4. ターゲット・キーワード（説明文・チュートリアルに散りばめる）

| カテゴリ | 検索されやすい語 |
|---|---|
| 画像/コード | `qr code api`, `qr code generator api`, `barcode api`, `ean13 generator`, `wifi qr code` |
| 書類 | `invoice api`, `generate invoice`, `markdown to html api` |
| データ | `json formatter api`, `csv to json`, `yaml to json`, `data conversion api` |
| 暗号/認証 | `hash api`, `hmac`, `jwt decode api`, `jwt sign`, `bcrypt api`, `uuid generator api` |
| 検証 | `email validation api`, `iban validation`, `credit card validation`, `luhn`, `phone number validation` |
| 国際化 | `transliteration api`, `romaji`, `japanese text api`, `postal code api`, `currency converter api` |
| 開発ツール | `color contrast api`, `unit converter api`, `timezone api`, `cidr calculator`, `pii redaction api` |

> これらを **Short/Long description と各 Tutorial 本文に自然に含める**と、検索ヒットが増えます。

---

## 5. ランキングを上げる運用Tips

1. **Tutorials を充実**（`docs/rapidapi-content.md` の4本）→ ページ内テキスト量＝SEOに有利
2. **Spotlight を設定**（バナー画像つき）→ 滞在・CTR向上
3. **最初のレビュー/Discussion を用意** → 社会的証明（既に★5×1件あり 👍）
4. **無料枠で利用者数を増やす** → RapidAPIは利用数・人気度を順位に反映
5. **エンドポイントの summary/description を具体的に**（OpenAPIに反映済み）
6. 定期的に**新エンドポイントを追加**（“Recently updated”で再露出）

---

## 6. 反映先まとめ

| テキスト | 反映先 |
|---|---|
| 最適化タイトル | General → API名 |
| Short description | General → Short Description |
| Long description 冒頭 | General → Long Description の先頭に追記 |
| キーワード | 説明文・各Tutorialに散りばめ |
