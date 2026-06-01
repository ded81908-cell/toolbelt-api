# 設計ドキュメント — Toolbelt API

このシステムが「何で・どう動き・運用に何が必要か」を1枚にまとめたものです。
GitHub リポジトリを受け取ったあと、この設計に沿ってデプロイ／出品します。

---

## 1. 一言でいうと

**AI を一切使わない、軽量な「開発者向けユーティリティ API」**を1つだけ作り、
**RapidAPI（API のマーケットプレイス）で従量課金で売る**システムです。

- サーバーのコストは極小（CPU をほとんど食わない処理ばかり）
- 課金・請求・利用者管理は **RapidAPI が肩代わり**してくれる
- コードは1本。そこから**日本向け出品**と**海外向け出品**の2つを同時に出せる

---

## 2. 全体構成（登場人物は4つだけ）

```
            ┌──────────────┐   git push    ┌──────────────┐
   あなた ──▶│   GitHub     │ ───────────▶ │    Render     │   ← API 本体が動く場所
            │ (ソース置場) │   自動デプロイ │ (Docker/Node) │     https://xxx.onrender.com
            └──────────────┘               └───────▲───────┘
                                                   │ プロキシ秘密鍵で
                                                   │ 認証された通信のみ信頼
            ┌──────────────┐   API 呼び出し ┌───────┴───────┐
   利用者 ──▶│   RapidAPI   │ ───────────▶ │  あなたの API  │
 (世界中の  │  (販売窓口)  │               └───────────────┘
  開発者)   │ 課金/制限/鍵 │
            └──────────────┘
```

| 登場人物 | 役割 | 課金・運用負担 |
|---|---|---|
| **あなた** | コードを GitHub に置く（最初の1回だけ手を動かす） | ほぼゼロ |
| **GitHub** | ソースコード置き場。push すると Render に自動反映 | 無料 |
| **Render** | API 本体が常時動くサーバー（Docker で起動） | 無料〜数百円/月 |
| **RapidAPI** | 販売窓口。利用者登録・課金・回数制限・APIキー発行を**全部代行** | 売上から手数料 |
| **利用者** | 世界中の開発者。RapidAPI 経由で API を叩く | （彼らが払う） |

ポイント：**お金と利用者管理は RapidAPI が持つ**ので、あなたのサーバーは
「正しい RapidAPI からの通信か？」だけを確認すれば済みます。

---

## 3. リクエストの流れ（1回の呼び出しで何が起きるか）

```
利用者のコード
   │  例: POST https://<rapidapi-host>/v1/qr  { "text": "hello" }
   ▼
RapidAPI ゲートウェイ
   │  ・利用者の契約プラン/残回数をチェック（超過なら 429 を返す）
   │  ・課金カウントを +1
   │  ・あなたのサーバーへ転送。その際に秘密ヘッダを付ける
   │     X-RapidAPI-Proxy-Secret: <あなただけが知る値>
   │     X-RapidAPI-User: <利用者ID>
   ▼
あなたの API (Render 上)
   1. onRequest フック … 秘密ヘッダを検証（合致しなければ 401）
   2. レート制限 ……… ティア別の1分あたり上限を確認
   3. ルート処理 ……… QR を生成して返す
   4. onResponse フック … 自前のメータリングに +1（任意・分析用）
   ▼
利用者に結果が返る
```

実装上のフック（`src/server.ts`）:
- `onRequest`: `authenticate()` で認証。`/` と `/docs`、`/health` は公開。
- `@fastify/rate-limit`: `clientId` 単位・ティア別に1分窓で制限。
- `onResponse`: `/v1/*` の成功呼び出しを `UsageMeter` に記録。

---

## 4. 認証の設計（`src/auth.ts`）

優先順に **3つの経路**を受け付けます。

| 優先 | 経路 | 判定方法 | 割り当てティア |
|---|---|---|---|
| 1 | **RapidAPI 経由** | `X-RapidAPI-Proxy-Secret` が `RAPIDAPI_PROXY_SECRET` と一致 | `pro` |
| 2 | **直接 API キー** | `X-API-Key` が `API_KEYS` に存在 | キーに紐づくティア |
| 3 | **匿名（開発用）** | `ALLOW_ANONYMOUS=true` のときだけ | `free` |

> 本番では「1（RapidAPI）」が主役。RapidAPI 以外からの直アクセスは
> 秘密鍵を知らないので弾かれ、**RapidAPI の課金を迂回されない**設計です。
> 「2」は自分でテストする時や直販したい時用。「3」はローカル開発専用。

---

## 5. ティアとレート制限

3段階のティアを用意（`src/config.ts`）。数値は環境変数で調整可能。

| ティア | 1分あたり上限（既定） | 用途 |
|---|---|---|
| `free` | 30 | RapidAPI の無料プラン／お試し |
| `pro` | 300 | 有料プラン（RapidAPI 経由は既定でここ） |
| `ultra` | 3000 | 大口・上位プラン |

> RapidAPI 側でも**プランごとの月間/日次クォータ**を設定します。
> つまり制限は2層：**RapidAPI（課金プラン）＋ 自サーバー（瞬間スパイク防止）**。

---

## 6. 環境変数（Render のダッシュボードで設定）

| 変数 | 必須 | 説明 |
|---|---|---|
| `PORT` | – | 待受ポート（既定 3000、Render が指定） |
| `RAPIDAPI_PROXY_SECRET` | **本番で必須** | RapidAPI の Security 設定に表示される秘密鍵 |
| `API_KEYS` | 任意 | 直販用キー。`key:tier` をカンマ区切り（例 `abc:pro,xyz:free`） |
| `ALLOW_ANONYMOUS` | 任意 | `true` でローカル開発時に認証を外す（本番は false） |
| `RATE_LIMIT_FREE/PRO/ULTRA` | 任意 | ティア別の1分上限を上書き |

> **秘密は Git に置かない**。`render.yaml` では `sync: false` にしてあり、
> 実値は Render のダッシュボードでのみ入力します。

---

## 7. デプロイ設計（Render + Docker）

- **Docker**（`Dockerfile`）: ビルド段で `npm run build`、実行段は `--omit=dev` の
  最小イメージ。`USER node` で非 root 実行。
- **`render.yaml`**: `type: web` / `runtime: docker` / `plan: free` /
  `healthCheckPath: /health`。GitHub と接続すれば **push で自動デプロイ**。
- **ヘルスチェック**: `/health`（公開・認証不要）が `{status:"ok"}` を返す。

```
git push ──▶ GitHub ──▶ Render が検知 ──▶ docker build ──▶ 起動 ──▶ /health 確認 ──▶ 切替
```

---

## 8. 「1コード → 2出品」戦略（海外同時展開）

コードは1本・デプロイも1つ。**RapidAPI のリスティング（出品）を2枚**作るだけ。

```
                     ┌────────────────── RapidAPI 出品A（日本向け）
  1つの Render URL ──┤   日本語の説明文・国内SEO・円圏向け価格
   (同じバックエンド) └────────────────── RapidAPI 出品B（グローバル）
                         英語の説明文・global SEO・ドル圏向け価格
```

- 追加の開発コストは**ほぼゼロ**（同じエンドポイントを2つの棚に並べるだけ）
- git は**trunk ベース**で十分。市場を分けるのはブランチではなく「出品」。

---

## 9. 提供エンドポイント一覧（現在 21 本）

| 分類 | エンドポイント |
|---|---|
| 汎用 | `/v1/qr` `/v1/ogimage` `/v1/convert/*`（CSV⇄JSON 等）`/v1/hash` `/v1/encode` `/v1/uuid` `/v1/password` `/v1/slug` ほか |
| 🇯🇵 日本語 | `/v1/jp/convert`（全角半角・かな・ローマ字）`/v1/jp/slug` |
| バルク | `/v1/qr/bulk` `/v1/hash/bulk` |
| 画像/コード | `/v1/barcode`（Code128/EAN/UPC/ITF/DataMatrix/PDF417） |
| 書類 | `/v1/invoice`（SVG 請求書）`/v1/markdown`（Markdown→HTML） |
| 🌍 国際化 | `/v1/translit` `/v1/slug/intl` `/v1/phone` `/v1/postal` `/v1/currency/convert` |
| 運用 | `/health`（公開）`/v1/usage`（自分の利用状況）`/docs`（Swagger UI） |

> 全エンドポイントは `X-API-Key`（または RapidAPI 経由）が必要。`/docs` で対話的に試せます。

---

## 10. あなたがやる初回セットアップ（約1時間・一回限り）

1. **GitHub にコードを置く**（このリポジトリを push） … 5分
2. **Render でデプロイ** … GitHub 連携 → `render.yaml` 検出 → 自動ビルド … 15分
3. **RapidAPI にアカウント作成＋API 出品** … 20分
   - 自分の Render URL を Base URL に設定
   - Security で **Proxy Secret** を生成し、その値を Render の
     `RAPIDAPI_PROXY_SECRET` に登録
   - OpenAPI（`/docs` の定義）を取り込めばエンドポイント一覧が自動で入る
   - 無料/Pro/Ultra のプランと価格を設定
4. **入金口座（Stripe 等）を RapidAPI に接続** … 10分
5. （任意）**2枚目の出品**を英語で複製 … 10分

> これ以降の機能追加は「私が実装 → push → Render 自動デプロイ → RapidAPI 反映」で回り、
> あなたの定常作業はほぼ料金表の微調整程度です。

---

## 11. 拡張・将来の差し替えポイント

| 今（MVP） | 将来の選択肢 |
|---|---|
| メータリングはメモリ内（`UsageMeter`） | Redis / 集計基盤へ。多インスタンスでも合算可能に |
| 課金は RapidAPI 任せ | 直販したいなら Stripe 従量課金へ `record()` を流す |
| 為替は手動レート or 無料 API のキャッシュ | 有料 FX フィードへ差し替え（`src/routes/currency.ts` のみ） |
| レート制限はプロセス内 | Redis ストアにして水平スケール対応 |

---

## 12. 運用とコスト感

- **サーバー費**: Render free〜数百円/月。CPU をほぼ使わない処理なので低コスト。
- **可変費**: ほぼ無し（AI 不使用 ＝ トークン代ゼロ）。
- **収益**: RapidAPI の月額プラン＋超過従量。手数料を引いた額が入金。
- **監視**: `/health` と `/v1/usage`。CI（`.github`）でビルド・テストを検証。

---

### 関連ファイル早見表
```
src/server.ts          フック登録・全ルート結線
src/auth.ts            3経路の認証
src/config.ts          環境変数 → 設定（ティア/レート上限）
src/usage.ts           メータリング（差し替え前提の薄い実装）
src/routes/*           各エンドポイント
render.yaml            Render 自動デプロイ定義
Dockerfile             本番イメージ（multi-stage）
.env.example           設定の見本
```
