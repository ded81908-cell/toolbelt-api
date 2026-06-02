# Toolbelt API — 運用ハンドブック（全部まとめ）

このAPIビジネスの「いま」「仕組み」「これからやること」「困ったとき」を1枚にまとめた総合ガイドです。

---

## 1. これは何か（30秒）

- **AIを使わない決定的ユーティリティREST API**（80エンドポイント）を1本作り、**RapidAPIで従量課金で販売**。
- 限界費用ほぼゼロ → **粗利ほぼ100%**。課金・APIキー・請求はRapidAPIが代行。
- コードは1本で、**日本向け出品**と**グローバル出品**の2枚に展開可能。

---

## 2. いまの状態（ステータス）

| 項目 | 状態 |
|---|---|
| コード | **80エンドポイント** / テスト93件パス / CI緑 |
| デプロイ | Render（Docker・無料プラン）で本番稼働中 `https://toolbelt-api-9oll.onrender.com` |
| 認証連携 | RapidAPI Proxy Secret ↔ Render `RAPIDAPI_PROXY_SECRET` 一致・検証済み |
| 出品（日本向け） | 公開済み・価格4プラン（BASIC/PRO/ULTRA/MEGA）・★5×1 |
| 入金 | PayPal/口座 設定済み |
| ブランド | ロゴ・ワードマーク・バナー・OG画像 一式あり |

---

## 3. 仕組み（登場人物4つ）

```
あなた → GitHub →(push で自動デプロイ)→ Render（API本体）
                                            ▲ Proxy Secret で
利用者 → RapidAPI（課金/制限/鍵）───────────┘ 認証された通信のみ信頼
```

- **あなた**＝コードを置くだけ／**GitHub→Render**＝自動デプロイ／**RapidAPI**＝販売・課金代行／**利用者**＝世界中の開発者。
- 認証3経路：①RapidAPI（Proxy Secret）②直接APIキー（`X-API-Key`）③匿名（devのみ）。詳細は `src/auth.ts`。

---

## 4. 機能を追加するときの流れ（今後の運用）

```
私が実装 → PR → あなたがマージ → Render自動デプロイ → RapidAPIで再インポート
```

1. 機能を実装してPRを作成（CIが自動でビルド・テスト）
2. あなたがGitHubで **Merge**
3. Renderが`main`を検知して**自動再デプロイ**（数分）→ 本番に反映、`/docs/json`も更新
4. RapidAPI側で **OpenAPIを再インポート**（または定義URL `…/docs/json` を指定して自動同期）
   - URL同期にしておくと、以後は再インポート不要で自動反映

> **重要な順番**：必ず「マージ＆再デプロイ」→「再インポート」。逆だと新エンドポイントが404になります。

---

## 5. お金まわり

- **コスト**：Render無料〜数百円/月。AI不使用なので可変費ほぼゼロ。
- **価格**：BASIC $0 / PRO $9.99 / ULTRA $29.99 / MEGA $99.99（月額＋超過従量）。
- **入金**：RapidAPIが回収→手数料を引いてPayPal/口座へ。
- **最適化**：公開後にRapidAPIアナリティクス（無料→有料転換率・人気EP）を見て価格・無料枠を調整。

---

## 6. これからやること（任意・優先順）

1. **最新80EPの再インポート**（PR #7・batch5マージ後）＋ 定義URL自動同期の設定
2. **グローバル英語出品**（同じBase URL＋同じProxy Secret、文面はEN）→ `docs/rapidapi-listing.md`「出品B」
3. **出品ページ充実**：Spotlight（バナー4種）/ Tutorials（4本）/ Discussions（ウェルカム）→ `docs/rapidapi-content.md`
4. **SEO反映**：`docs/seo.md` の最適化タイトル・キーワードを説明文へ
5. **さらに機能追加**：要望ベースで継続（“Recently updated”で再露出）

---

## 7. スケール／将来の差し替えポイント

| 今（MVP） | 将来 |
|---|---|
| 利用計測：メモリ内（`src/usage.ts`） | Redis / 集計基盤（多インスタンス対応） |
| 課金：RapidAPI任せ | 直販ならStripe従量へ `record()` を流す |
| レート制限：プロセス内 | Redisストアで水平スケール |
| 為替：手動/無料API | 有料FXフィード（`src/routes/currency.ts`のみ差替） |
| ホスト：Render無料 | 有料インスタンス（常時起動・スリープ無し） |

---

## 8. 困ったとき（クイック参照）

| 症状 | 対処 |
|---|---|
| RapidAPI経由で401 | Proxy Secret不一致。RapidAPIのSecret HeaderとRenderの`RAPIDAPI_PROXY_SECRET`を一致させ再デプロイ |
| 新EPが404 | 先にマージ＆再デプロイ→その後RapidAPI再インポート |
| 為替が503 | Renderのネットワーク制限。`rates`を渡すオフラインモードを使用 |
| 初回が遅い | 無料プランはアイドルでスリープ。有料で常時起動 |
| 文字化け（説明文） | 日本語フォント環境で確認。バナーは英語推奨 |

---

## 9. リポジトリ内の主要ドキュメント

| ファイル | 内容 |
|---|---|
| `README.md` | 全エンドポイント表・認証・デプロイ |
| `DESIGN.md` / `docs/design.html` | 設計（テキスト版／スタイル付き） |
| `docs/SETUP.md` | 初回セットアップ手順 |
| `docs/examples.md` | **全80EPの実リクエスト/レスポンス例** |
| `docs/rapidapi-listing.md` | 価格・出品文面（JP/EN） |
| `docs/rapidapi-content.md` | Spotlight / Tutorials / Discussions |
| `docs/seo.md` | SEO最適化コピー |
| `docs/code-examples.md` | curl/JS/Python 例 |
| `docs/HANDBOOK.md` | ← この総合ガイド |

---

## 10. コード地図

```
src/server.ts     フック（認証→レート制限→計測）＋全ルート結線
src/auth.ts       3経路の認証
src/config.ts     環境変数→設定（ティア/上限）
src/usage.ts      利用計測（差替前提の薄い実装）
src/routes/*      80エンドポイント（カテゴリ別ファイル）
render.yaml       Render自動デプロイ定義
Dockerfile        本番イメージ
```

> 困ったら、エラーメッセージや画面を共有してください。その場で原因を特定して直します。
