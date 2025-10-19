# Cloudflare Pages SSR から Workers へ移行し観測基盤を統合する

- ステータス: 承認済み（[20250928-adopt-cloudflare-pages-functions-for-discord-bot.md](20250928-adopt-cloudflare-pages-functions-for-discord-bot.md), [20250928-choose-pages-functions-over-app-routes-for-discord-interactions.md](20250928-choose-pages-functions-over-app-routes-for-discord-interactions.md) を置き換え）
- 日付: 2025-10-19
- タグ: cloudflare, observability, ssr, deployment, migration

技術ストーリー: <https://github.com/tooppoo/armoredcore-extreme-mercenaries/issues/924>

## 背景 / 文脈

フロントエンドSSRとDiscord slash commandを Cloudflare Pages Functions で運用してきたが、ログの永続化や分散トレースなどの可観測性が不足していた。Cloudflare 公式も新規Webアプリは Workers を推奨しており、Pages では tail のみでログ欠落が発生する。Workers Logs と Observability API を活用した長期的な保守性を確保するため、モノリシックSSR構成を Workers へ移行する。

## 決定ドライバ

- MUST: 構造化ログとトレースIDを保存可能な基盤へ移行し、障害調査の再現性を高める
- SHOULD: UDD>DDD>TDD の原則に従い、slash command の利用者体験を劣化させずに段階的移行する
- セキュリティ: Secrets を Workers 環境変数に集約し、最小権限原則を維持する
- 可逆性: 既存API/SSRを壊さずに移行し、必要ならService Bindingsで役割分割できる設計にする
- 運用: Logpush / Tail Worker / Sentry など後続の観測連携が容易な構成を準備する

## 検討した選択肢

1. Cloudflare Pages Functions を継続利用し、ログは外部にforwardする
2. SSRのみWorkersへ移行し、slash command はPagesに残す（ハイブリッド）
3. SSRとslash command のエントリポイントを単一の Cloudflare Worker に集約する（採択）

## 決定（採択）

選択したオプション: "SSRとslash command のエントリポイントを単一の Cloudflare Worker に集約する"。理由: Workers Logs / Observability を活用でき、Service Bindings など今後の拡張も Workers 側に集約される。Pages Functions と比較してログ欠落リスクが解消され、Cloudflare が推奨する最新構成と整合する。slash command とのネットワーク境界を共有することで追加レイテンシも発生しない。

## 影響評価

- セキュリティ: Secrets と D1 バインディングを Workers に移設し、構造化ログへ機微情報を含めない方針を維持。`observability.enabled = true` を設定した上で、Logpush/Alertingの追加は追跡課題に分割する。
- パフォーマンス: Worker への移行により Cloudflare のグローバルネットワークでの近接実行が維持される。静的アセットは `ASSETS` バインディング経由で高速配信し、slash command 処理は既存の p95<2s 目標を維持する。
- ユーザー体験: ルーティングは `/api/discord/interactions` を含め既存のURLを変更せずに移行するため、Discord コマンド利用者の体験は変化しない。SSRも同一ドメインで提供継続。
- アクセシビリティ: 直接の影響はないが、SSR処理の継続により既存のアクセシビリティ改善を阻害しない。
- トレーサビリティ: Workers Logs と Observability ダッシュボードを利用可能になり、`traceparent` ヘッダ導入やLogpushによる長期保管の準備が整う。Dev Alert送信には correlationId を付与し、今後Tail Worker経由で通知する計画。

### ポジティブな影響

- Cloudflare Workers Logs による永続化と検索性向上で障害調査の反復性が改善
- `wrangler deploy` に一本化されDev/Preview/Productionの構成管理が単純化
- モノリシックSSRでも Service Bindings を利用して観測粒度を落とさずに拡張可能

### ネガティブな影響 / トレードオフ

- Pages 専用ドキュメント・テンプレートの更新が必要（開発フローの教育コスト）
- Workers ではビルド成果物を明示的に生成する必要があり、`wrangler dev` 実行前に `react-router build` が必須
- Tail Worker / Logpush / Sentry など周辺観測機能は別Issueでの実装が必要

## 各選択肢の利点と欠点

### Pages Functions 継続

- 良い点: 既存構成を維持できるため移行コストがゼロ
- 悪い点: ログがtailのみで欠落し、過去の障害調査課題が解決しない
- 悪い点: Cloudflare 推奨構成から外れ、将来の機能投資から取り残される

### ハイブリッド（SSR Worker + Pages Functions）

- 良い点: SSRの観測性のみ改善し、slash command の変更影響を局所化できる
- 悪い点: 2つの実行基盤を管理するためSecretsやデプロイの一貫性が失われる
- 悪い点: slash commandのログ欠落課題が解消されず効果が限定的

### Workers へ全面移行（採択）

- 良い点: 観測性基盤を統一し、Secrets/デプロイ/ログ出力を単一Workerで管理できる
- 良い点: Cloudflare の今後の投資（Service Bindings, Observability）を直接活用できる
- 悪い点: Pages 固有のドキュメントが陳腐化するため、チームナレッジのアップデートが必要

## フォローアップ / 移行計画

- Tail Worker / Logpush でのSlack通知・長期保管を設計し、OTLPエクスポート経路を追加する
- `traceparent` ヘッダをSSRレスポンスに付与し、Discord APIとの連携トレースを整備する
- Service Bindings を活用した write/read 分離を設計し、Queues連携を検討する
- 旧ADR（Pages Functions 採択）に廃止ステータスを付与し、資料/Runbook/テストガイドをWorkers版へ更新する

## 参考リンク

- Cloudflare Workers Docs: <https://developers.cloudflare.com/workers/>
- Cloudflare Observability: <https://developers.cloudflare.com/observability/>
- Issue #924: Cloudflare Pages から Workers への移行検討 <https://github.com/tooppoo/armoredcore-extreme-mercenaries/issues/924>
- 旧ADR: [Cloudflare Pages Functions を採択](20250928-adopt-cloudflare-pages-functions-for-discord-bot.md), [Pages Functions での `/api/discord/interactions`](20250928-choose-pages-functions-over-app-routes-for-discord-interactions.md)
