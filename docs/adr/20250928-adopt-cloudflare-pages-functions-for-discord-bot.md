# Discord Bot を Cloudflare Pages Functions で実装する

- ステータス: 承認済み
- 日付: 2025-09-28
- タグ: discord, cloudflare, pages, worker, interactions, security, migration

技術ストーリー: https://github.com/tooppoo/armoredcore-extreme-mercenaries/issues/803

## 背景 / 文脈

Koyeb で稼働中の Discord Bot を Cloudflare 環境へ移管し、フロントエンドと統合したい。Bot は slash command のみを提供し、常駐プロセス（WebSocket等）は不要という前提である。Cloudflare での実装案として「1) Cloudflare Pages Functions（フロントAPIとして実装）」と「2) Cloudflare Worker（フロントから独立、DB共有）」の二案を比較・検討した。

## 決定ドライバ

- UDD > DDD > TDD を優先し、ユーザー価値（slash command の安定提供）を最短で実現したい
- 可逆性を高く保ち、将来の役割分離（read/write）や非同期化へ段階的に移行できること
- 最小権限・Secrets非露出・構造化ログなどのセキュリティ原則（MUST）への適合
- 実装・運用のシンプルさ（デプロイ/管理負荷の最小化）
- Discord の 3 秒 ACK 制約と署名検証（Ed25519）に適合できること

## 検討した選択肢

1. Cloudflare Pages Functions に `/api/discord/interactions` を実装する（フロントと統合）
1. Cloudflare Worker として独立アプリケーションに実装する（DB共有、front=read / worker=write）
1. 現状維持（Koyeb 上の実装を継続）

## 決定（採択）

選択したオプション: "Cloudflare Pages Functions に `/api/discord/interactions` を実装する"。
理由: 現時点の要件（slash commandのみ・常駐不要）に対して、実装と運用が最もシンプルで、Cloudflare への統合メリット（同一リポジトリ/デプロイ）の享受が大きい。将来、負荷・権限分離・再試行/非同期処理（Queues/cron）が必要になった場合に、書き込み/重い処理を Cloudflare Worker へ抽出することで可逆的にスケールできるため、現段階では最小構成を採択する。

## 影響評価

- セキュリティ: Secrets は Cloudflare のランタイム変数に格納し、構造化ログ（JSON）に機微情報を出力しない。Pages Functions 側では DB 書き込みを最小限に抑え、将来は write を Worker に集約して最小権限を強化する余地がある。
- パフォーマンス: Discord の 3 秒 ACK 制約を満たすため、軽量処理は同リクエスト内で完結し、重い処理は将来 Worker + Queues へ移行する方針。レスポンス時間・エラー率を継続計測する。
- ユーザー体験: フロントと同一ドメイン配下でのエンドポイント提供が容易になり、運用の一体性が高まる。slash command の応答安定性を重視する。
- アクセシビリティ: 該当なし（UI 影響は限定的）。
- トレーサビリティ: 責務を Pages Functions（ACK/軽量read）に寄せ、後に Worker を導入する場合はログ系を分離し、責務単位の可観測性を確保できる。

### ポジティブな影響

- デプロイ/運用経路が一本化され、変更の可逆性が高い
- 初期コストが小さく、迅速に移行判断の検証が可能
- セキュリティ原則（最小権限/Secrets管理/構造化ログ）への適合が容易

### ネガティブな影響 / トレードオフ

- 現時点では front=read / worker=write の厳密分離が未実施
- 再試行やバックグラウンド処理が必要になった際に、Worker への抽出作業が別途発生

## 各選択肢の利点と欠点

### 1) Cloudflare Pages Functions（採択）

- 良い点: 実装・運用が最小、フロントと同一の管理面で統合
- 良い点: Secrets/環境変数や構造化ログの方針を一体適用しやすい
- 悪い点: 強い権限分離や高度な非同期/再試行設計は将来の抽出が前提

### 2) Cloudflare Worker（独立）

- 良い点: front=read / worker=write の役割分離と最小権限を厳密に実施できる
- 良い点: Queues/cron/バックオフ/レート制御など拡張が明快
- 悪い点: 初期セットアップ・運用の手間が増える（別アプリ/Secrets分離）

### 3) 現状維持（Koyeb）

- 良い点: 変更不要
- 悪い点: Cloudflare への統合・運用一本化の要件を満たさない、定期にアクセスしないとsleepするので、pingが必要

## フォローアップ / 移行計画

実装は本 ADR では行わない（意思決定の記録のみ）。今後の実装着手時の高レベル計画を示す。

1. frontアプリケーション に `/api/discord/interactions` スケルトンを追加
2. Discord 署名検証（Ed25519）を実装し、3 秒以内に ACK（PONG/DEFERRED_*）を返却
3. Secrets（BOT_TOKEN, PUBLIC_KEY, DB_BINDING 等）を Cloudflare ランタイム変数に設定。ログは JSON 構造化・機微情報除外
4. 既存DB（種別は既存運用に従う）へ最小限の書き込みのみ許容（将来 write は Worker へ集約）
5. Discord Developer Portal で Interactions Endpoint URL を Pages へ切替
6. 運用計測（応答時間、エラー率、Discord レート制限）を確認し、必要に応じて Worker 抽出を検討

移行に伴い `/api/archives/challenge` `/api/archives/video` は廃止。
上記APIで行っていたバリデーション・登録処理は `/api/discord/interactions` でのコマンド処理結果にしたがい、同API内部で実行される。

将来の段階的分離（必要時）

- Pages Functions: ACK と軽い read、必要に応じてキュー投入のみ
- Worker: 重い処理・書き込み・再試行・レート制御・スケジュール実行
- DB/Secrets: write 系バインド/権限を Worker 側に集約し最小権限を強化

## 2025-10-05 追記

- `packages/front/functions/api/discord/interactions.ts` で Discord 送信者の ID / 表示名をブランド型として取り扱い、`logger.withCorrelation(correlationId)` を用いた info/warn/error ログ整合性を確保した。
- Vitest に `interactions.errors.spec.ts` と `performance.spec.ts` を追加し、署名欠落・OGP 失敗・例外発生時のレスポンスと p95 latency < 2s を継続検証できるようにした。対象ファイルの Statements カバレッジは 81.69%。
- 依存監査（`pnpm audit`）で `@noble/ed25519@3.0.0` に脆弱性は確認されなかったが、`drizzle-kit` 経由の `esbuild<=0.24.2`（GHSA-67mh-4wv8-2f99）を把握し、開発専用利用とアップデート監視を継続する。
- Secrets 運用および監査ログは `docs/checklist/add-dependency.md` に記録し、Pages プロジェクトの環境変数でのみ本番値を管理する方針を明文化した。

## 参考リンク

- Issue: 移行検討と方針 https://github.com/tooppoo/armoredcore-extreme-mercenaries/issues/803
- Cloudflare Pages Functions（公式）: https://developers.cloudflare.com/pages/functions/
- Cloudflare Workers（公式）: https://developers.cloudflare.com/workers/
- Cloudflare Queues: https://developers.cloudflare.com/queues/
- Discord Interactions（署名検証/応答）: https://discord.com/developers/docs/interactions/receiving-and-responding
