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
pnpm run dev:pages   # wrangler pages dev を想定
```
- `/api/discord/interactions` が 8788 などローカルポートで待機。
- Miniflare の D1 in-memory を利用し、マイグレーションを適用。

## 4. 自動テスト
### 4.1 ユニットテスト（Vitest）
```bash
cd packages/front
pnpm test -- --runInBand src/functions/api/discord/__tests__/interactions.test.ts
```
- ケース: 署名検証成功/失敗、Ping ハンドリング、OGP フォールバック。
- カバレッジ: `pnpm test -- --coverage`（Workers プール対応設定要追加）。

### 4.2 統合テスト（Miniflare）
```bash
cd packages/front
pnpm test -- --runInBand src/functions/api/discord/__tests__/interactions.integration.test.ts
```
- 実際の JSON リクエストを POST → D1 in-memory を検証。
- 公開メッセージにエフェメラルフラグが含まれないことを確認。

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
6. 旧 Koyeb Bot を disable、ロールバック手順として wrangler ログと D1 バックアップを取得

## 7. ログ・監視
- `console.log(JSON.stringify({ level, correlationId, message, context }))` 形式で出力
- Cloudflare Dash の Logpush を設定し、エラー/フォールバックを可視化
- Slash Command エラー発生時は `DISCORD_DEV_ALERT_CHANNEL_ID` へ通知

## 8. トラブルシューティング
- **401 Unauthorized**: 署名ヘッダー不正 → Cloudflare Pages で `DISCORD_PUBLIC_KEY` を再確認
- **D1 書き込み失敗**: マイグレーション未適用 → `pnpm front db:migrate` を実行
- **OGP タイムアウト**: 2 秒タイムアウトによりフォールバック → URL を検証し必要なら手動補完

