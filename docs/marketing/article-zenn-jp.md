---
title: "QR・請求書・日本語処理…開発の「地味タスク」を80個まとめたAPIを作った"
emoji: "🧰"
type: "tech"
topics: ["api", "javascript", "python", "個人開発", "日本語処理"]
published: true
---

> Zenn 投稿用。冒頭の frontmatter はそのまま使えます。`{...}` は公開前に置換してください。

## 作ったもの

[Toolbelt API](https://rapidapi.com/ded81908cell/api/toolbelt-api-Kai-Fa-Zhe-Xiang-keyuteiritei) — 開発で頻出する「地味だけど必要」な処理を**80エンドポイント**にまとめたユーティリティAPIです。AI不使用なので**高速・低コスト・決定的（毎回同じ結果）**。

QR・バーコード・請求書・Markdown・ハッシュ・JWT・UUID・各種バリデーション……そして他のAPIにあまりない **日本語処理（全角半角・かな・ローマ字）** が売りです。

## なぜ作ったか

個人開発でもよくあるのが「この小さい処理のためだけにライブラリ入れるの？」問題。

- 全角半角の正規化
- かな→ローマ字スラッグ
- 請求書のPDF/SVG生成
- QRコード

これらを**毎プロジェクトで再実装/依存追加**するのが面倒だったので、HTTPで叩けば終わる形にしました。

## 30秒で試す

```bash
# 全角→半角
curl -X POST "https://toolbelt-api-9oll.onrender.com/v1/jp/convert" \
  -H "X-RapidAPI-Key: {KEY}" -H "X-RapidAPI-Host: toolbelt-api-9oll.onrender.com" \
  -H "Content-Type: application/json" \
  -d '{"text":"ＡＢＣ１２３","operation":"hankaku"}'
# → {"result":"ABC123"}
```

```bash
# 請求書（SVG・税込合計を自動計算）
curl -X POST "https://toolbelt-api-9oll.onrender.com/v1/invoice" \
  -H "X-RapidAPI-Key: {KEY}" -H "X-RapidAPI-Host: toolbelt-api-9oll.onrender.com" \
  -H "Content-Type: application/json" \
  -d '{"number":"INV-001","currency":"JPY","taxRate":10,
       "from":{"name":"自社"},"to":{"name":"取引先"},
       "items":[{"description":"制作費","quantity":1,"unitPrice":50000}]}'
```

## 代表的なエンドポイント

| カテゴリ | 例 |
|---|---|
| 🇯🇵 日本語 | `/v1/jp/convert` `/v1/jp/slug` |
| QR/コード | `/v1/qr` `/v1/barcode` `/v1/qr/wifi` |
| 書類 | `/v1/invoice` `/v1/markdown` |
| データ | `/v1/convert` `/v1/json/format` `/v1/hash` |
| 認証 | `/v1/jwt/sign` `/v1/bcrypt/hash` |
| 検証 | `/v1/validate/email` `/creditcard` `/iban` |
| 国際化 | `/v1/phone` `/v1/postal` `/v1/currency/convert` |

## 使いどころ

- ブログ/EC：日本語タイトル→URLスラッグ自動化
- 管理画面：入力の全角半角正規化、メール/カード/電話の検証
- 請求/見積：SVG請求書をそのまま印刷・PDF化
- マーケ：QR（Wi-Fi・vCard対応）をオンデマンド生成

## おわりに

無料プランがあるので、まずは気軽に叩いてみてください 👉 **https://rapidapi.com/ded81908cell/api/toolbelt-api-Kai-Fa-Zhe-Xiang-keyuteiritei**

「この処理も欲しい」という要望があれば、わりとすぐ追加します。コメント/リアクションお待ちしています！
