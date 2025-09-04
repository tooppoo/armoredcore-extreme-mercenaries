---
status: accepted
date: 2025-09-04
---

# ドキュメント配置を AGENTS.md に準拠させる

## 文脈

- チーム内のドキュメント配置が機能別メモ、データ定義、ADR、要件定義で散在しており、参照導線が弱かった。
- 最新の `AGENTS.md` では、要件定義は `docs/domain/{要件名}.md`、ドメインモデルは `docs/domain/domain-model.md`、意思決定は `docs/adr/{YYYYMMDD}-{title}.md` に配置する方針が明記されている。

## 決定

- `docs/README.md` を入口に、以下を明示的にリンクする構成へ整理した。
  - ドメイン要件: `docs/domain/*.md`
  - ドメインモデル: `docs/domain/domain-model.md`
  - ADR 一覧: `docs/adr/index.md`
  - データモデル: `docs/data/README.md`
  - 機能詳細メモ: `docs/functions/*`
- 未整備だった「アーカイブ機能」の要件定義を `docs/domain/archive.md` として追加（既存の実装メモと ER 図へ参照を付与）。

## 影響

- 参照性/一覧性が向上し、新規参画者のオンボーディングが容易になる。
- 要件→モデル→実装メモ→意思決定の導線が一貫するため、トレーサビリティが強化される。

## 選択肢と却下理由

- 現状維持（却下）: 参照導線の弱さが残り、AGENTS.md の方針に不一致。
- すべてを ADR 化（却下）: ADR は意思決定ログであり、要件/設計そのものの置き場としては過剰。

## セキュリティ/パフォーマンス/UX/アクセシビリティ/トレーサビリティ

- セキュリティ: 要件/モデルに「公開/非公開情報」の扱いを明記しやすくなる（例: `responseBody` を外部通知に含めない）。
- パフォーマンス: 非機能要件の置き場を一本化でき、計測観点や SLO を明示しやすい。
- UX: ドキュメント入口からの導線を簡素化して学習コストを削減。
- アクセシビリティ: ドキュメント構造の一貫性により、支援技術でのナビゲーションが容易。
- トレーサビリティ: 「要件 → ドメインモデル → ADR → 実装メモ → データモデル」のリンク関係が明確化。

## 実施項目

1. `docs/README.md` を更新し、Domain/ADR/Data/Functions/FAQ のセクションとリンクを整備。
2. `docs/domain/archive.md` を新規作成し、要件定義を簡潔に作成。既存の `docs/functions/archive/README.md` と `docs/data/README.md` を参照。

## 追跡

- 今後の新機能は、まず `docs/domain/{要件名}.md` と `docs/domain/domain-model.md` の更新から着手する。
- 設計上の決定や運用方針の変更は `docs/adr/{YYYYMMDD}-{title}.md` に記録する。
