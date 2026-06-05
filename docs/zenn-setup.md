# Zenn × GitHub 連携セットアップ

このリポジトリは Zenn の「GitHubからのデプロイ」に対応した構成になっています。
記事は `articles/` に配置済み（`articles/toolbelt-api-launch.md`）。

## あなたがやること（連携ボタンを押すだけ）

1. https://zenn.dev にログイン
2. 右上アイコン → **「GitHubからのデプロイ」**（または ダッシュボード → Deploys）
3. **「リポジトリを連携する」** をクリック
4. GitHub認証 → `ded81908-cell/toolbelt-api` を選択して連携
5. 連携完了後、Zenn が `articles/` を自動で読み取り、`published: true` の記事を公開します

> 連携は一度きり。以降は記事を `articles/*.md` に追加して `main` に push するだけで自動公開されます。

## 公開状態の切り替え

- `published: true` → 公開
- `published: false` → 下書き（Zenn上では非公開プレビュー）

## 新しい記事を追加するには

`articles/` に新しい `.md` を作成（ファイル名＝スラッグ、半角英数字・ハイフン・アンダースコア、12〜50文字）：

```markdown
---
title: "記事タイトル"
emoji: "🧰"
type: "tech"   # tech（技術記事）または idea（アイデア）
topics: ["api", "javascript"]
published: true
---

本文...
```

push すれば数十秒〜数分で Zenn に反映されます。

## 注意

- スラッグ（ファイル名）は後から変えると URL が変わるので確定後は変更しない
- 連携対象ブランチは Zenn 側で指定（デフォルト `main`）。`main` にマージされた記事が公開対象
