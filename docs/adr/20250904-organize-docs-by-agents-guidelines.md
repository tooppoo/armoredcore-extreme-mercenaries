# ADR: ドキュメント配置を AGENTS.md に準拠させる

## 日付
2025-09-04

## コンテキスト
- ドキュメント（実装メモ/データ定義/ADR/要件定義）が散在し、参照導線が弱かった。
- 最新方針では「要件定義は `requirements/`、ドメインモデルは `docs/domain/domain-model.md`、意思決定は `docs/adr/`」に配置する。

## 決定
- 入口を `docs/README.md` に集約し、以下のリンク構造で統一。
  - ドメイン要件: `docs/requirements/*.md`
  - ドメインモデル: `docs/domain/domain-model.md`
  - ADR 一覧: `docs/adr/index.md`
  - データモデル: `docs/data/README.md`
  - 機能詳細メモ: `docs/functions/*`
- 「アーカイブ機能」の要件定義を `docs/requirements/archive.md` として作成し、既存の実装メモ/ER 図へ参照を付与。

## 影響
- 参照性/一覧性の向上、オンボーディング容易化。
- 要件→モデル→ADR→実装メモ→データモデルの導線が一貫し、トレーサビリティ強化。

## 選択肢と却下理由
- 現状維持: 方針不一致と導線の弱さが残るため却下。
- 全てを ADR 化: ADR は意思決定ログであり、要件/設計の置き場としては過剰のため却下。

## 品質観点（S/P/UX/A11y/Trace）
- セキュリティ: 公開/非公開情報の扱いを要件/モデルに明記しやすい（例: `responseBody` は外部通知に含めない）。
- パフォーマンス: 非機能要件の置き場を一本化し、計測・SLO の明文化が容易。
- ユーザー体験: 入口導線の簡素化で学習コストを削減。
- アクセシビリティ: 構造の一貫性で支援技術によるナビゲーションが容易。
- トレーサビリティ: 文書間のリンク関係が明確化。

## 実施項目
1. `docs/README.md` を更新（Domain/ADR/Data/Functions/FAQ）。
2. `docs/requirements/archive.md` を作成し、実装メモ/ER 図へ参照を付与。
3. 既存参照（`docs/domain/*.md`）を `docs/requirements/*.md` に更新。

## 追跡
- 新機能はまず `docs/requirements/{要件名}.md` と `docs/domain/domain-model.md` を更新。
- 設計上の決定や運用方針の変更は `docs/adr/{YYYYMMDD}-{title}.md` に記録。
