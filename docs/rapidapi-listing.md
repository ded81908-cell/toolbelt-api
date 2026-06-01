# RapidAPI 出品アセット（コピペ用）

このファイルは、RapidAPI に出品するときに**そのまま貼り付けて使える素材集**です。
コードは1本のまま、**日本向け出品**と**グローバル出品**の2枚を作る前提でまとめています。

---

## 0. インポート手順（最初にやること）

1. RapidAPI Provider Dashboard → **Add New API**
2. 入力方法は **「OpenAPI」** を選び、デプロイ済みサーバーの
   **`https://<your-app>.onrender.com/docs/json`** を指定（または同 JSON を貼付）
   - 検証済み：`OpenAPI 3.0.3 / 39 オペレーション / summary 欠落 0 / apiKey 認証`
3. **Base URL** に Render の URL を設定
4. **Security**：API Key を `X-API-Key`（ヘッダ）に設定。RapidAPI が発行するプロキシ秘密鍵を
   控え、Render の環境変数 `RAPIDAPI_PROXY_SECRET` に登録（これで RapidAPI 以外の直叩きを遮断）
5. 下記「価格表」を Plans に設定 → 公開

> 機能を追加して再 push したら、RapidAPI 側で **OpenAPI を再インポート**すれば新エンドポイントが反映されます。

---

## 1. 価格表（free / pro / ultra / mega）

限界費用ほぼゼロ（AI不使用）なので、**無料枠で集客 → 従量で回収**の設計。
数値は出発点。RapidAPI ダッシュボードでいつでも調整可能です。

| プラン | 月額 | 月間リクエスト込み | 超過単価 | バースト上限(自前) | 想定ユーザー |
|---|---|---|---|---|---|
| **BASIC**（無料） | $0 | 1,000 / 月（ハード制限） | – | 30 req/分 | お試し・個人開発 |
| **PRO** | $9.99 | 50,000 / 月 | $0.0004 / req | 300 req/分 | 小規模サービス |
| **ULTRA** | $29.99 | 300,000 / 月 | $0.0002 / req | 3,000 req/分 | 成長中サービス |
| **MEGA** | $99.99 | 2,000,000 / 月 | $0.0001 / req | 3,000 req/分 | 大口・社内基盤 |

> **価格は「公開時の出発点」です。**「最適価格」は事前には決まらず、公開後に RapidAPI のアナリティクス（無料→有料の転換率・解約率・人気エンドポイント）を見て調整して最適化します。序盤は無料枠をやや広め（1,000/月）にして集客・レビュー獲得を優先する設計です。

- 「バースト上限(自前)」は当 API のティア別レート制限（`RATE_LIMIT_*`）と一致。RapidAPI の月間枠とは別レイヤの瞬間スパイク防止。
- RapidAPI 経由のトラフィックは既定で `pro` ティア相当として扱われます（`src/auth.ts`）。
- 値付けの考え方：競合の汎用ユーティリティ API は無料枠 100〜1,000/月、有料 $5〜$30 が中心。やや広めの無料枠で star/レビューを集め、上位で回収。

---

## 2. 出品メタ情報

### カテゴリ / タグ
- **Category**: Tools（または Data）
- **Tags（英）**: `qr-code, barcode, invoice, markdown, csv, json, yaml, hashing, uuid, slug, transliteration, phone, postal, currency, japanese, i18n, utilities`
- **Tags（日 出品でも英タグ推奨）**: 上記に加え `日本語, 全角半角, ローマ字, バーコード, 請求書`

---

## 3. 出品A：日本向け（日本語文面）

**Name**
```
Toolbelt API — 開発者向けユーティリティ（日本語対応）
```

**Short description（一覧用・〜140字）**
```
QR・バーコード・請求書・Markdown・ハッシュ・データ変換に加え、日本語処理（全角半角・かな・ローマ字）を1つにまとめた高速API。AI不使用で低コスト・低レイテンシ。
```

**Long description（詳細ページ用）**
```
日本のアプリ開発でよく必要になる「地味で頻出」な処理を、1つのAPIにまとめました。

▸ 日本語テキスト：全角⇄半角、ひらがな⇄カタカナ、かな→ローマ字、ローマ字スラッグ
▸ QR / バーコード：QRコード＋Code128/EAN/UPC/ITF/DataMatrix/PDF417（PNG・SVG）
▸ 書類：請求書（SVG・税込合計を自動計算）、Markdown→サニタイズ済みHTML
▸ データ：JSON⇄YAML⇄CSV 変換、ハッシュ（SHA/MD5/HMAC）、base64/hex
▸ 生成：UUID・パスワード・トークン・スラッグ
▸ バルク：1リクエストで最大200件
▸ 国際化：翻字・電話番号整形(E.164)・郵便番号正規化・通貨換算
▸ 開発ツール：JWT解析・色変換/WCAGコントラスト・単位/日時/距離変換
▸ バリデーション：メール・クレジットカード(Luhn)・IBAN・パスワード強度
▸ 構造化QR：Wi-Fi接続用・連絡先(vCard)

特徴
・AI不使用 → 低コスト・高速・結果が安定（決定的）
・全エンドポイントは /docs の対話ドキュメント（Swagger UI）で試せます
・認証は X-API-Key ヘッダ（RapidAPI が自動付与）

まずは無料プランでお試しください。
```

**Example（日本語コメント付き）**
```bash
# 全角→半角に正規化
curl -X POST https://<host>/v1/jp/convert \
  -H "X-RapidAPI-Key: YOUR_KEY" -H "Content-Type: application/json" \
  -d '{"text":"ＡＢＣ１２３","operation":"hankaku"}'
# → {"operation":"hankaku","result":"ABC123"}
```

---

## 4. 出品B：グローバル（English copy）

**Name**
```
Toolbelt API — Developer Utilities (QR, Barcodes, Invoices, i18n)
```

**Short description (≈140 chars)**
```
One fast API for QR & barcodes, invoices, Markdown→HTML, CSV/JSON/YAML, hashing, generators, bulk ops and i18n (transliteration, phone, postal, currency). No AI bills.
```

**Long description**
```
Bundle the boring, high-frequency utilities every app needs behind a single, fast, predictable API.

▸ QR & barcodes: QR plus Code128/EAN/UPC/ITF/DataMatrix/PDF417 (PNG or SVG)
▸ Documents: invoices (SVG, auto-computed totals), Markdown → sanitized HTML
▸ Data: JSON⇄YAML⇄CSV, hashing (SHA/MD5/HMAC), base64/url/hex
▸ Generators: UUIDs, strong passwords, tokens, slugs
▸ Bulk: up to 200 items per request
▸ Internationalisation: transliteration (accents, Cyrillic, Greek), phone parse/format (E.164), postal-code normalisation (JP/US/CA/GB/DE/FR), currency conversion
▸ Japanese pack: width, kana and romaji conversion
▸ Dev tools: JWT decode, colour convert/WCAG contrast, unit/time/geo conversion
▸ Validators: email, credit card (Luhn), IBAN, password strength
▸ Structured QR: Wi-Fi join, contact (vCard)

Why
- No AI/inference cost → cheap, fast, deterministic results
- Try every endpoint interactively at /docs (Swagger UI)
- Simple auth via the X-API-Key header (handled by RapidAPI)

Start free, scale as you grow.
```

**Example**
```bash
# Generate an EAN-13 barcode as PNG
curl -X POST https://<host>/v1/barcode \
  -H "X-RapidAPI-Key: YOUR_KEY" -H "Content-Type: application/json" \
  -d '{"type":"ean13","text":"4006381333931"}' --output barcode.png
```

---

## 5. エンドポイント・ハイライト（一覧の "Highlights" 用）

| 訴求 | エンドポイント |
|---|---|
| QR & barcodes | `POST /v1/qr` · `POST /v1/barcode` · `POST /v1/qr/bulk` |
| Documents | `POST /v1/invoice` · `POST /v1/markdown` |
| Japanese 🇯🇵 | `POST /v1/jp/convert` · `POST /v1/jp/slug` |
| i18n 🌍 | `POST /v1/translit` · `POST /v1/phone` · `POST /v1/postal` · `POST /v1/currency/convert` |
| Data & gen | `POST /v1/convert` · `POST /v1/hash` · `GET /v1/uuid` · `POST /v1/lorem` |
| Dev tools | `POST /v1/jwt/decode` · `POST /v1/color/contrast` · `POST /v1/units/convert` |
| Validators | `POST /v1/validate/email` · `/creditcard` · `/iban` · `POST /v1/password/strength` |

---

## 6. 2出品の運用メモ

- **同じ Base URL（同じ Render デプロイ）** を両出品に設定 → 開発は1本で完結。
- 違うのは**文面・タグ・スクリーンショット・（必要なら）価格**だけ。
- 日本向けは日本語処理を、グローバルは i18n/バーコード/請求書を前面に。
- レビュー/評価は出品ごとに別々に貯まるので、両市場でSEOを取りに行けます。

> 価格は両出品とも USD 建て（RapidAPI 仕様）。為替で割安に見せたい場合のみ JP 側を微調整。
