# optional 依存更新時の CI 方針整理

- ステータス: 承認済み
- 日付: 2025-09-22
- タグ: CI/CD 依存管理 Renovate

## 背景 / 文脈

依存パッケージの更新は Renovate によって自動化されている。`pnpm-lock.yaml` には Rollup のプラットフォーム別バイナリや LightningCSS、Cloudflare workerd など `optionalDependencies` 扱いのアーティファクトが多く、Renovate が頻繁に更新 PR を生成する。これらは optional 扱いである一方、Linux 環境の CI でも実際に利用されており、破損するとビルドや静的アセット生成に影響を与える可能性がある。CI の負荷を抑えつつ品質を確保するため、optional 依存更新時の扱いを整理する必要があった。

## 決定ドライバ

- Rollup・LightningCSS など optional 依存でも CI のビルド経路で実行されるものがあり、スキップすると不具合検知が遅れるリスクがある。
- E2E/Lighthouse は実行時間が長く、Renovate の PR が多い状態ではランナーコストが無視できなくなる。
- optional 依存更新を 1 PR にまとめれば、CI 実行回数とレビュー負荷を抑えやすい。

## 検討した選択肢

1. optional 更新 PR では lint/test/e2e/lighthouse をすべてスキップする。
2. optional 更新 PR では lint を除外しつつ、test/typecheck と軽量な E2E/Lighthouse のスモークのみ実行する。
3. optional 更新 PR でも通常変更と同じく全 CI（lint/test/e2e/lighthouse）を実行しつつ、Renovate で optional 依存をグルーピングする。

## 決定（採択）

選択したオプション: "optional 更新でも全 CI を実行し、Renovate で optional 依存グループをまとめる"。

理由: optional 依存はビルドや実行環境全体へ影響し得るため、テスト範囲を削ると不具合検知が遅れる。ワークフローを特別扱いすると設定が複雑化し、長期的に保守が難しくなる。代わりに Renovate の `packageRules` で Rollup/LightningCSS/Cloudflare workerd/sharp 等の optional 依存をそれぞれ一つの PR にまとめ、CI 実行回数を抑制することでコストと品質のバランスを取る。

## 影響評価

- セキュリティ / 品質: optional 依存によるビルド破綻も通常 CI で早期検知できる。
- コスト: optional 依存 PR でもフル CI を走らせるため、単体 PR のコストは高いが、Renovate のグルーピングにより PR 数を削減し全体の実行回数を抑えられる見込み。
- 運用: optional 更新専用のワークフローパスを廃止し、設定の複雑さを回避。Renovate 設定は `packageRules` 追加で明確化された。
- トレーサビリティ: optional 依存グループが明示されることで、更新履歴の追跡が容易になる。

## フォローアップ

- Renovate のグルーピングが意図どおり機能しているか、次回以降の bot PR で確認する。
- optional 依存による CI 時間の増加が運用上問題になる場合、スモークテスト構成の再検討を行う。
