# Discord Interactions を Pages Functions（`functions/api/discord/interactions.ts`）で実装する

- ステータス: 廃止（[20251019-migrate-cloudflare-pages-to-workers.md](20251019-migrate-cloudflare-pages-to-workers.md) によって置き換え）
- 日付: 2025-09-28
- タグ: discord, cloudflare, pages-functions, interactions, security, performance

関連: [20250928-adopt-cloudflare-pages-functions-for-discord-bot.md](20250928-adopt-cloudflare-pages-functions-for-discord-bot.md)

## 背景 / 文脈

Discord Slash Command（Interactions）の受け口を Cloudflare 環境に移行するにあたり、
エンドポイントを以下のどちらに配置するか検討した：

1. Cloudflare Pages Functions の `functions/api/discord/interactions.ts`
1. React Router ベースの `packages/front/app/routes/api/*`

Interactions では「Ed25519署名検証」および「3秒以内のACK」が必須であり、
中間レイヤの影響を極小化して早期応答・厳格検証を実現する必要がある。

## 検討した選択肢

1. Pages Functions（`functions/api/discord/interactions.ts`）
1. app/routes（`app/routes/api/**`）

## 決定（採択）

選択したオプション: "Pages Functions（`functions/api/discord/interactions.ts`）"。
理由: 生のHTTPリクエストに最短経路でアクセスでき、署名検証に必要なヘッダ・ボディを安全に扱える。
ルータ/SSR層の初期化を避けることで、3秒ACKの制約に余裕を持たせられる。
将来の責務分離（front=read / worker=write）や監査・ロギング分離にも適合する。

## 影響評価

- セキュリティ: 署名検証を最前段で実施可能。UI層のセッション/クッキー等と分離し、Secretsの曝露面を縮小。
- パフォーマンス: ルーティング/SSRレイヤを経由しないため、ACKまでの遅延を最小化。
- 運用/可観測性: Interactions専用の構造化ログを独立させ、責務単位での監視・アラート設定が容易。
- テスト容易性: Miniflare+Vitest で Workers ランタイムを直接テストでき、契約/統合テストが単純化。

### トレードオフ

- app/routes にAPIを集約しているプロジェクトでは一元管理性が低下する可能性がある。
  → Interactions はフロントUIと独立した要件（署名/ACK/公開メッセージ）を持つため、専用レイヤに配置する旨をドキュメント化して緩和。

## フォローアップ

- 実装は `packages/front/functions/api/discord/interactions.ts` に配置する。
- 既存の `app/routes/api/**` には Interactions ルートを作らない（二重定義回避）。
- 将来、書き込み負荷や再試行要件が増した場合は、Worker + Queues への抽出を再検討する。
