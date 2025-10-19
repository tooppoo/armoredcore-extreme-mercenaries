# 手動テストログ: Cloudflare Workers Discord アーカイブ Bot

## 実行日時

- 2025-10-05T03:12:30Z（UTC）

## 自動テスト

| コマンド | 結果 | 備考 |
| --- | --- | --- |
| `pnpm --filter @ac-extreme-mercenaries/front test` | ✅ | Vitest 87件通過。`logger.withCorrelation` の warn/error 出力を含む。|
| `pnpm --filter @ac-extreme-mercenaries/front coverage -- --reporter text-summary` | ⚠️ | 全体 Statements 51.97%、Branches 78.59%。`functions/api/discord/interactions.ts` は Statements 81.69%。`app/lib` や `app/routes` 配下に未カバー領域が残存。 |

## パフォーマンス検証

- `packages/front/functions/api/discord/__tests__/performance.spec.ts` を実行し、OGP フォールバック/成功パスの p95 < 2s を確認（疑似遅延 15ms / 10ms）。

## 手動シナリオ

1. Cloudflare Workers dev サーバーを `pnpm --filter @ac-extreme-mercenaries/front run start` で起動し、ngrok で `/api/discord/interactions` を公開。
2. Discord Test Server で `/archive-challenge` を送信。成功レスポンスと公開メッセージを確認。
3. 同チャンネルで `/archive-video` を同一 URL で再送し、「登録済み」応答を確認。
4. `https://httpstat.us/404` を `/archive-video` で送信し、フォールバック文言と warn ログ（`video_upsert_ogp_failed`）を確認。
5. 許可外チャンネルで `/archive-challenge` を送信し、403 と warn ログ（`challenge_command_invalid`）を確認。

> 手動シナリオは実機検証待ち。実施後は日時と結果を追記すること。

## 既知のリスク

- `pnpm audit`（2025-10-05）で `drizzle-kit` 経由の `esbuild<=0.24.2` に GHSA-67mh-4wv8-2f99 が報告されている。現状は開発専用依存のため本番経路には含まれないが、上流のアップデートを監視する。
- フロントエンド全体のカバレッジが 80% を下回っている。`app/routes` と `app/lib/utils` の未テスト領域に追加テストが必要。`functions/api/discord` については 80% 以上を維持。

## ロールバック手順メモ

- Cloudflare Workers のデプロイ一覧を確認し、`wrangler deployments list --env production` で対象を特定した上で `wrangler deployments rollback <deployment-id> --env production` を実施。
- D1 の差分は `wrangler d1 export` でバックアップし、障害時は `wrangler d1 execute --file` で復元。
- Discord Slash Command のエンドポイント URL を旧バージョンへ差し戻す。
