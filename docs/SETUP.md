# 初回セットアップ完全ガイド（約1時間・一回限り）

デプロイ → RapidAPI 出品 → 入金口座接続までの手順です。
**手を動かすのはこの1回だけ**。以降は私が push → 自動デプロイで回します。

> 前提：GitHub アカウント／このリポジトリ（PR #1 をマージ済み、または対象ブランチ）。
> クレジットカードは Render 無料プランでは不要。RapidAPI の入金受け取りには口座が必要です。

---

## ステップ1：コードを `main` に入れる（5分）

PR #1 はレビュー可能状態です。GitHub 上で **Merge pull request** を押して `main` に取り込みます。
（または、Render では対象ブランチを直接指定することも可能です。）

---

## ステップ2：Render でデプロイ（15分）

> **カードについて**：Blueprint 経路はワークスペースに支払い方法の登録が必要です。
> ただし**無料プランは登録しても $0**（本人確認用で、勝手に課金されません）。課金は自分で
> 有料インスタンスに上げた時だけ。無料枠は上限超過時も課金ではなくスリープで止まります。
> カードを避けたい場合は **New + → Web Service**（Blueprint不使用）でも同じ Dockerfile を
> デプロイでき、無料枠はカード不要で通ることが多いです。

1. https://render.com にサインアップ（GitHub でログインが楽）
2. ダッシュボード右上 **New +** → **Blueprint** を選択
3. このリポジトリを接続 → Render が **`render.yaml` を自動検出**
4. **Apply / Create** を押すとビルドが始まる（Docker イメージを作成 → 起動）
5. 数分で `https://<app-name>.onrender.com` が払い出される

> `render.yaml` は plan: free / healthCheckPath: /health 済み。基本そのままでOK。

### 環境変数（Render → 該当サービス → Environment）
まずは最低限これだけ：

| Key | Value | 備考 |
|---|---|---|
| `API_KEYS` | `mytest:pro` | 自分の動作確認用。あとで削除可 |
| `RAPIDAPI_PROXY_SECRET` | （ステップ4で取得して後で入力） | 今は空でOK |

保存すると自動で再デプロイされます。

---

## ステップ3：動作確認（5分）

ブラウザ or ターミナルで：

```bash
# 生存確認（認証不要）
curl https://<app-name>.onrender.com/health
# → {"status":"ok","uptime":...}

# 対話ドキュメント
open https://<app-name>.onrender.com/docs   # ブラウザで Swagger UI が開く

# 認証つきで1本叩く
curl -X POST https://<app-name>.onrender.com/v1/qr \
  -H "X-API-Key: mytest" -H "Content-Type: application/json" \
  -d '{"text":"hello","format":"png"}' --output qr.png
```

`/health` が ok、`/docs` が開けば成功です。

---

## ステップ4：RapidAPI に出品（20分）

1. https://rapidapi.com/ にサインアップ → **My APIs**（Provider Dashboard）
2. **Add New API**
3. 取り込み方法で **OpenAPI** を選び、
   **`https://<app-name>.onrender.com/docs/json`** を指定（URL貼付）
   - これで 51 エンドポイントが自動で入ります
4. **Base URL（Target）** に `https://<app-name>.onrender.com` を設定
5. **Security**
   - 利用者向け：API Key（`X-API-Key`、ヘッダ）— RapidAPI が自動付与
   - **プロキシ秘密鍵**：RapidAPI が生成する `X-RapidAPI-Proxy-Secret` の値を**コピー**
6. その値を **Render の環境変数 `RAPIDAPI_PROXY_SECRET`** に貼り付けて保存
   （→ これで「RapidAPI 経由の通信だけを信頼」＝課金の迂回を防止）

> 文面・タグ・価格は `docs/rapidapi-listing.md` からコピペできます。

---

## ステップ5：プラン・価格を設定（10分）

Provider Dashboard → **Plans** で、`docs/rapidapi-listing.md` の価格表を入力：

| プラン | 月額 | 月間込み | 超過 |
|---|---|---|---|
| BASIC | $0 | 1,000 | – |
| PRO | $9.99 | 50,000 | $0.0004 |
| ULTRA | $29.99 | 300,000 | $0.0002 |
| MEGA | $99.99 | 2,000,000 | $0.0001 |

各プランの **Rate limit**（例：BASIC=30 req/min）も合わせて設定。

---

## ステップ6：入金口座を接続（10分）

Provider Dashboard → **Payouts / Billing** で Stripe など受取口座を接続。
（売上は RapidAPI が回収し、手数料を引いて入金されます。）

---

## ステップ7：テスト購読して動作確認

1. 別アカウント（または同アカウント）で自分の API に **BASIC（無料）** をサブスク
2. RapidAPI の **「Endpoints」タブ右側のコードサンプル**で実行 → 200 が返ればOK
3. うまくいったら **Make Public** で公開

---

## ステップ8（任意）：2枚目の出品＝グローバル展開

- **Add New API** をもう一度。**同じ Base URL** を指定。
- 文面は `docs/rapidapi-listing.md`「出品B（English）」を使用。
- 開発は1本のまま、日本向け／世界向けの2棚で集客。

---

## トラブルシュート

| 症状 | 原因と対処 |
|---|---|
| RapidAPI から呼ぶと 401 | `RAPIDAPI_PROXY_SECRET` が Render と RapidAPI で不一致。コピペし直して再保存 |
| `/health` は OK だが `/v1/*` が 401 | 直叩きで `X-API-Key` 未指定。RapidAPI 経由 or `API_KEYS` のキーを付ける |
| 為替 `/v1/currency/convert` が 503 | Render のネットワークが外部FX不可。`rates` を渡すオフラインモードを使用 |
| 初回アクセスが遅い | Render 無料プランはアイドルでスリープ。有料プランで常時起動に |
| OpenAPI に新機能が出ない | 機能追加後、RapidAPI で **OpenAPI を再インポート** |

---

## 完了チェックリスト

- [ ] Render にデプロイ済み、`/health` が ok
- [ ] `/docs` が開ける
- [ ] RapidAPI に OpenAPI を取り込み、Base URL 設定
- [ ] `RAPIDAPI_PROXY_SECRET` を Render に登録（RapidAPI と一致）
- [ ] プラン・価格・レート制限を設定
- [ ] 入金口座を接続
- [ ] テスト購読で 200 を確認 → 公開
- [ ]（任意）グローバル出品を複製

これが終われば、あとは機能追加を私が push → 自動反映で回せます。
