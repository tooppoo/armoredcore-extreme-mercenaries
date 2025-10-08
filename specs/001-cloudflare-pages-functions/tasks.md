# Tasks: Cloudflare Pages Functions Discord アーカイブ Bot

**Input**: Design documents from `/specs/001-cloudflare-pages-functions/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/, quickstart.md

## Phase 3.1-3.3（完了済みメモ）
- ✅ Pages Functions ハンドラのスキャフォールド、署名検証ユーティリティ、リポジトリ／バリデータ／通知／ロガーは `packages/front/app/lib/discord/interactions/` に統合済み。
- ✅ `.spec.ts` ベースのテストで PING 応答、重複検知、OGP フォールバック、署名・チャンネル制限をカバー済み。
- ✅ `data-model.md` の方針に従い、追加テーブルや新規マイグレーションは導入しない。

## Phase 3.4: ハンドラ強化・統合
- [x] T101 `packages/front/functions/api/discord/interactions.ts` の許可チャンネル計算を `DISCORD_ALLOWED_CHALLENGE_ARCHIVE_CHANNEL_IDS` と `DISCORD_ALLOWED_VIDEO_ARCHIVE_CHANNEL_IDS` の和集合に修正し、同ファイルおよび `packages/front/functions/api/discord/__tests__/signature.guard.spec.ts` でカバレッジを追加する。
- [x] T102 `packages/front/functions/api/discord/interactions.ts` に `zod` での Interaction パースと `Result` 型（成功/失敗）を導入し、Parse don't validate 原則で `/archive-*` コマンド入力を型安全に扱う。異常時は構造化レスポンス（`type=4` のエラーメッセージ）を返す。
- [x] T103 Discord リクエストの `member` / `user` から送信者ID・表示名を抽出し、`packages/front/app/lib/discord/interactions/archive-repository.ts` へ渡す型をブランド化する。対応するテストを追加する。
- [x] T104 `packages/front/functions/api/discord/interactions.ts` のログ出力を `logger.withCorrelation(correlationId)` に統一し、正常系は `info`、入力不備は `warn`、予期しない例外は `error` で出力する。`packages/front/app/lib/observability/logger.ts` のマスキング方針と整合させる。

## Phase 3.5: テスト・ドキュメント整備
- [x] T105 `packages/front/functions/api/discord/__tests__/interactions.errors.spec.ts` を作成し、署名不備・バリデーション失敗・OGP 失敗・例外時のレスポンスとログ分岐を網羅する。
- [x] T106 `packages/front/functions/api/discord/__tests__/performance.spec.ts` で OGP 取得タイムアウトと D1 模擬書き込みの計測を行い、95パーセンタイル < 2s を確認して記録する。
- [x] T107 `specs/001-cloudflare-pages-functions/quickstart.md` と `docs/spec/archive/spec.md` を現行の `.spec.ts` / `app/lib/discord` 構成に更新する。
- [x] T108 Secrets 運用と依存追加記録を `docs/checklist/add-dependency.md` 等に追記し、`@noble/ed25519@3.0.0` の監査結果を残す。
- [ ] T109 `pnpm test --filter @ac-extreme-mercenaries/front` を実行してカバレッジ80%以上を確認し、結果を記録する。
- [x] T110 `docs/test/discord-bot-pages.md` に手動検証手順（ngrok + Discord Test Server）と実施結果を追記する。
- [x] T111 `docs/adr/20250928-adopt-cloudflare-pages-functions-for-discord-bot.md` へ新構成と依存採用理由を反映する。
- [x] T112 `pnpm --filter @ac-extreme-mercenaries/front run lint` と `pnpm --filter @ac-extreme-mercenaries/front run typecheck` を完走させ、必要な修正を行う。
- [ ] T113 `AGENTS.md`, quickstart, spec, README から旧 Koyeb Bot 記述を除去し、整合性を確認する。

## Dependencies
- T101 → T102（正しいチャンネルリストを前提にパースを実装）
- T102 → T103, T104, T105（Result 型とログ整備に依存）
- テスト／ドキュメント系（T105-T113）は実装タスク完了後に実施

## Parallel Execution Example
```
# Batch 1 (ハンドラ改修)
Task: "T101 allowed channel union fix"
Task: "T102 interaction parser"
Task: "T103 user metadata brand"
Task: "T104 structured logging"

# Batch 2 (品質保証)
Task: "T105 error handling tests"
Task: "T106 performance metrics"
Task: "T112 lint/typecheck"

# Batch 3 (ドキュメント)
Task: "T107 quickstart更新"
Task: "T108 secrets記録"
Task: "T109 coverage run"
Task: "T110 manual test log"
Task: "T111 ADR更新"
Task: "T113 final doc sweep"
```

## Notes
- 追加テーブルやマイグレーションは禁止（`data-model.md`）。
- `.spec.ts` の命名と `app/lib` 配置は `docs/naming.md` を参照する。
- Secrets は Cloudflare Pages UI で管理し、`.dev.vars` にはダミー値のみ記載する。
