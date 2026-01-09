# Armored Core Extreme Mercenaries

ARMAC（Armored Core Extreme Mercenaries）関連コンテンツのアーカイブと公開を支援するモノレポジトリ。Discord Bot と Web フロントエンドを中心に、動画・チャレンジ情報の収集や閲覧を行えるように構成。

## 構成概要

- `packages/front`: Cloudflare Workers / React Router を用いたフロントエンドおよび Workers Runtime (Discord Slash Command ハンドラを内包)
- `packages/discord-bot`: レガシーの自前ホスティング版 Discord Bot（保守終了、必要時のみコード参照）
- `packages/e2e`: Playwright による E2E テスト群
- `packages/adr`: ADR ドキュメントビューア（Eleventy ベース）
- `docs/`: 仕様・ADR・チェックリストなどの開発ドキュメント（[詳細](docs/README.md)）

## 必要要件

- Node.js 24.12.0 以上（`package.json` の `engine` を参照）
- pnpm 10 系（`package.json` の `packageManager` を参照）

## セットアップ

```bash
pnpm install
pnpm front migration
pnpm front seed:local
```

## スクリプト

| コマンド | 説明 |
| --- | --- |
| `pnpm run front dev` | フロントエンド開発サーバーを起動（React Router dev） |
| `pnpm run front start` | Workers ランタイムでSSR + APIを実行（`wrangler dev`） |
| `pnpm run discord-bot dev` | Discord Bot をローカル起動（`.env` / `.env.local` 必須） |
| `pnpm run test` | ルート配下のテストスクリプトを一括実行 |
| `pnpm run lint` / `pnpm run typecheck` | Lint / 型チェック |
| `pnpm run coverage` | 各パッケージのカバレッジ取得 |
| `pnpm run adr` | ADR 用ビルド・プレビューコマンド群 |

> 環境変数の詳細や手順は、各パッケージの README もしくは `docs/spec/` 配下の資料を参照してください。

## ドキュメント

- 開発ドキュメントの索引: [`docs/README.md`](docs/README.md)
- ADR ガイドライン: [`docs/adr/README.md`](docs/adr/README.md)
- 用語集: [`docs/terms.md`](docs/terms.md)
- FAQ: [`docs/faq.md`](docs/faq.md)

## 開発ポリシー

- AGENTS.md に記載の開発プロセス（UDD > DDD > TDD, セキュリティファースト など）に従う
- 仕様変更時は関連するドキュメント（要求/シナリオ/要件/ADR/用語）を同時更新する
- 依存ライブラリの追加は `docs/checklist/add-dependency.md` の手順で承認を得る

## ライセンス

MIT License
