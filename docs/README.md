# 開発ドキュメント

リポジトリのドキュメントは `docs/` に集約しています。用途に応じた参照先は以下の通りです。

## 仕様・プロセス

`docs/spec/` は AGENTS.md で定義されたプロセス（要求 → シナリオ → 要件 → ユースケース → 仕様）に基づき、テーマごとにファイルを整理しています。

- テンプレート類: `docs/spec/templates/_requests.md`, `_scenario.md`, `_requirements.md`, `_usecase.md`
- テーマ別資料の例: `docs/spec/challenge-archive-discord-command/`, `docs/spec/archive/`, `docs/spec/sitemap-etag-ttl-optimization/`, `docs/spec/ci-flaky-detection/`
- 共通ドメイン資料: `docs/spec/shared/domain-model.md`

## ADR（意思決定記録）

- 各意思決定: `docs/adr/{YYYYMMDD}-{title}.md`
- 一覧: `docs/adr/index.md`
- 運用ガイドライン: `docs/adr/README.md`
- テンプレート: `docs/adr/template.md`

## チェックリスト

- 依存追加時の確認事項: `docs/checklist/add-dependency.md`

## 用語集

- プロジェクト固有の用語定義: `docs/terms.md`

## FAQ / ナレッジ

- よくある質問や補足情報: `docs/faq.md`

## 編集時のメモ

- 新しいドキュメントを追加するときは既存ディレクトリ構成に従い、必要に応じてテンプレートを複製してください。
- 仕様や設計を変更する際は、関連する ADR・チェックリスト・用語集の整合性も必ず確認してください。
