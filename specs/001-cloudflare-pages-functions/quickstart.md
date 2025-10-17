# Quickstart: Cloudflare Pages Functions Discord アーカイブ Bot

## 1. 事前準備
- Node.js 22.18.0 以上 / pnpm 10.17.1
- Cloudflare アカウント（Pages / D1 アクセス権あり）
- Discord Developer Portal のアプリケーション（Public Key, Bot Token, Slash Command 登録済み）
- `.env.local` や Pages プロジェクトに以下を登録
  - `DISCORD_PUBLIC_KEY`
  - `DISCORD_BOT_TOKEN`
  - `DISCORD_ALLOWED_CHALLENGE_ARCHIVE_CHANNEL_IDS`
  - `DISCORD_ALLOWED_VIDEO_ARCHIVE_CHANNEL_IDS`
  - `DISCORD_DEV_ALERT_CHANNEL_ID`
  - `D1_DB`（Pages Functions 用バインディング）

## 2. インストール
```bash
pnpm install
```

## 3. ローカル開発（Miniflare）
```bash
cd packages/front
pnpm run dev   # wrangler pages dev を想定
```
- `/api/discord/interactions` がローカルポート（例: 8788）で待機。
- Miniflare の D1 in-memory を利用し、必要に応じて `pnpm run migration:test` でテーブルを初期化。

## 4. 自動テスト
### 4.1 Discord Interactions テスト（Vitest）
```bash
pnpm --filter @ac-extreme-mercenaries/front test -- \
  packages/front/functions/api/discord/__tests__/interactions.contract.spec.ts \
  packages/front/functions/api/discord/__tests__/signature.guard.spec.ts \
  packages/front/functions/api/discord/__tests__/interactions.challenge.integration.spec.ts \
  packages/front/functions/api/discord/__tests__/interactions.video.integration.spec.ts \
  packages/front/functions/api/discord/__tests__/interactions.errors.spec.ts \
  packages/front/functions/api/discord/__tests__/interactions.ogp.integration.spec.ts
```
- コマンド引数を省略すると front パッケージ全体の Vitest が実行される。
- `.spec.ts` はすべて `packages/front/functions/api/discord/__tests__/` 配下に配置し、Workers ランタイムで実行する。

### 4.2 パフォーマンステスト（p95 < 2s）
```bash
pnpm --filter @ac-extreme-mercenaries/front test -- \
  packages/front/functions/api/discord/__tests__/performance.spec.ts
```
- Miniflare 上で OGP 取得タイムアウトと D1 書き込みを模擬し、95 パーセンタイルが 2 秒未満であることを確認。
- `logger.withCorrelation(correlationId)` の warn 出力と Dev Alert 呼び出しも検証される。

## 5. 手動検証（Discord Test Server）
1. Discord Developer Portal で Interactions Endpoint をローカル ngrok URL に設定。
2. Test Server の指定チャンネルで `/archive-challenge` コマンドを送信。
3. D1（Miniflare or Cloudflare Dashboard）で新規レコードを確認。
4. `/archive-video` で重複 URL を送り、公開メッセージが「登録済み」になることを確認。
5. OGP 取得失敗ケースとして `https://httpstat.us/404` を送信し、フォールバック文言とエラーコードログを確認。

## 6. デプロイ手順
1. PR 作成 → テスト通過 → レビュー
2. `pnpm --filter @ac-extreme-mercenaries/front run deploy`（Pages ビルド）
3. Cloudflare Pages プロジェクトで Secrets / D1 バインディングを最新化
4. Discord Developer Portal で Interactions Endpoint を本番 URL へ切り替え
5. `/archive-...` コマンドを本番チャンネルで実行し、成功レスポンス・D1 登録を確認
6. Cloudflare Pages デプロイ後に Slash Command を再登録し、ロールバック手順として wrangler ログと D1 バックアップを取得

## 7. ログ・監視
- `logger.withCorrelation(correlationId).info|warn|error` で JSON 構造化ログを出力（機微情報は含めない）
- Cloudflare Dash の Logpush を設定し、`video_upsert_*` / `challenge_upsert_*` で検索すると追跡が容易
- Slash Command エラー発生時は `DISCORD_DEV_ALERT_CHANNEL_ID` への通知で一次対応を起動

## 8. トラブルシューティング
- **401 Unauthorized**: 署名ヘッダー不正 → Cloudflare Pages で `DISCORD_PUBLIC_KEY` を再確認
- **D1 書き込み失敗**: マイグレーション未適用 → `pnpm front db:migrate` を実行
- **OGP タイムアウト**: 2 秒タイムアウトによりフォールバック → URL を検証し必要なら手動補完
