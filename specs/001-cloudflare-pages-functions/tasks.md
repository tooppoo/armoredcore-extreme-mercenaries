# Tasks: Cloudflare Pages Functions Discord アーカイブ Bot

**Input**: Design documents from `/specs/001-cloudflare-pages-functions/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/, quickstart.md

## Phase 3.1: Setup
- [ ] T001 Set up `packages/front/functions/api/discord/` scaffold and stub `interactions.ts` with no-op handler (export default `onRequest`) to unblock test imports.
- [ ] T002 Add `@noble/ed25519@3.0.0` to `packages/front/package.json` & `pnpm-lock.yaml`, update dependency checklist, and run `pnpm install`.
 - [ ] T003 Configure Cloudflare Pages bindings in `packages/front/wrangler.toml`（D1 `DB` のみ確認）。DISCORD_* は wrangler.toml に書かず、Cloudflare Pages の環境変数/Secrets と `.dev.vars`（ローカル）で供給する方針を明記。

## Phase 3.2: Tests First (TDD)
- [ ] T004 [P] Author contract tests for `POST /api/discord/interactions` in `packages/front/functions/api/discord/__tests__/interactions.contract.test.ts` covering PING, signature failure (401), and public message flag assertions.
- [ ] T005 [P] Create integration test for `/archive-challenge` happy path in `packages/front/functions/api/discord/__tests__/interactions.challenge.integration.test.ts` (deferred ACK → success message, D1 insert mock).
- [ ] T006 [P] Create integration test for `/archive-video` duplicate URL handling in `packages/front/functions/api/discord/__tests__/interactions.video.integration.test.ts`.
- [ ] T007 [P] Create integration test for OGP取得失敗フォールバック in `packages/front/functions/api/discord/__tests__/interactions.ogp.integration.test.ts` (timeout → fallback copy, dev alert).
- [ ] T008 [P] Add unit tests for署名検証・チャンネル制限 in `packages/front/functions/api/discord/__tests__/signature.guard.test.ts`.

## Phase 3.3: Core Implementation (after tests are red)
- [ ] T009 [P] Implement `ArchiveSubmission` schema & helpers in `packages/front/functions/api/discord/domain/archiveSubmission.ts` (validate inputs, derive stored payload).
- [ ] T010 [P] Implement `ProcessingOutcome` data structure in `packages/front/functions/api/discord/domain/processingOutcome.ts` with status enum + logging payload builders.
- [ ] T011 [P] Implement `OGPMetadata` cache model in `packages/front/functions/api/discord/domain/ogpMetadata.ts` with TTL helpers.
- [ ] T012 Create Drizzle migration `packages/front/drizzle/migrations/00x_cloudflare_pages_discord.sql` to add required columns/tables (`processing_outcome`, OGP fields) with reversible down script.
- [ ] T013 Update `packages/front/app/db/schema.server.ts` and related drizzle types to expose new entities & indexes; ensure existing archives APIs remain unaffected.
- [ ] T014 Implement archive repository (`packages/front/functions/api/discord/repository/archiveRepository.ts`) to upsert challenge/video submissions via D1 prepared statements.
- [ ] T015 Implement processing outcome repository (`packages/front/functions/api/discord/repository/outcomeRepository.ts`) to record statuses & fetch duplicates.
- [ ] T016 Implement OGP metadata repository/cache utilities in `packages/front/functions/api/discord/repository/ogpMetadataRepository.ts`.
- [ ] T017 Implement OGP fetcher with 2s timeout & fallback in `packages/front/functions/api/discord/services/ogpFetcher.ts` using `undici`/`AbortController`.
- [ ] T018 Implement Discord署名検証ユーティリティ in `packages/front/functions/api/discord/security/verifySignature.ts` using `@noble/ed25519`.
- [ ] T019 Implement Slash Command validation & channel guard in `packages/front/functions/api/discord/application/commandValidator.ts` (allowed channels, required options, duplication guard).
- [ ] T020 Implement command dispatcher in `packages/front/functions/api/discord/application/commandDispatcher.ts` orchestrating repository calls & response payloads.
- [ ] T021 Implement developer alert notifier in `packages/front/functions/api/discord/notifications/devAlert.ts` posting to `DISCORD_DEV_ALERT_CHANNEL_ID` via Bot token with retry/backoff.
- [ ] T022 Implement `packages/front/functions/api/discord/interactions.ts` main handler wiring: signature verification, command dispatch, structured logging, correlation IDs, deferred/public responses.
- [ ] T023 Ensure structured JSON logging module (`packages/front/functions/api/discord/observability/logger.ts`) + log formatting integration across handler & repositories.

## Phase 3.4: Integration & Validation
- [ ] T024 Wire Cloudflare Pages bindings in `packages/front/load-context.ts` or equivalent to pass D1 connection & secrets to Functions runtime tests.
- [ ] T025 Update Quickstart (`specs/001-cloudflare-pages-functions/quickstart.md` + `docs/spec/archive/spec.md`) with new env vars, Miniflare commands, and validation steps.
- [ ] T026 Document secrets & operational runbooks in `docs/checklist/add-dependency.md` / relevant docs, including `pnpm audit` verification for新依存。
- [ ] T027 Execute automated test suite (`pnpm test --filter @ac-extreme-mercenaries/front`) ensuring new tests pass and capture coverage report.
- [ ] T028 Perform manual Quickstart verification (ngrok + Discord test server) and log evidence in `docs/test/discord-bot-pages.md`.
- [ ] T029 Update release notes/ADR references (if behavior changes) ensuring decision trail in `docs/adr/20250928-adopt-cloudflare-pages-functions-for-discord-bot.md` remains consistent.

## Phase 3.5: Polish
- [ ] T030 [P] Add unit tests for error handling/logging branches in `packages/front/functions/api/discord/__tests__/interactions.errors.test.ts`.
- [ ] T031 [P] Add performance check script (OGP fetch latency, D1 write p95) and note results in `packages/front/functions/api/discord/__tests__/performance.test.ts` or measurement doc.
- [ ] T032 [P] Run lint/typecheck (`pnpm --filter @ac-extreme-mercenaries/front run lint && run typecheck`) and address findings.
- [ ] T033 [P] Final doc sweep: ensure `AGENTS.md`, quickstart, spec remain in sync; remove dead code and confirm old Koyeb bot references are deprecated.

## Dependencies
- T001 → T002 → T003 (setup chain)
- Tests (T004-T008) must fail before starting implementation tasks T009+.
- Repository/Services（T009-T014）完了がハンドラ結線（T015-T016）に必須。
- Integration（T017-T022）は実装（T009-T016）に依存。
- Polish（T023-T026）は統合後に実施。

## Parallel Execution Example
```
# Suggested parallel batch 1 (after setup):
Task: "T004 [P] contract tests in interactions.contract.test.ts"
Task: "T005 [P] integration test for /archive-challenge"
Task: "T006 [P] integration test for /archive-video"
Task: "T007 [P] integration test for OGP fallback"
Task: "T008 [P] unit tests for signature guard"

# Suggested parallel batch 2 (after repos/services ready):
Task: "T009 [P] archive repository"
Task: "T010 [P] OGP fetcher"
Task: "T011 [P] signature verification"
Task: "T012 [P] command validator"

# Suggested parallel batch 3 (polish stage):
Task: "T030 [P] error handling unit tests"
Task: "T031 [P] performance check script"
Task: "T032 [P] lint/typecheck fixes"
Task: "T033 [P] final documentation sweep"
```

## Notes
- [P] タスクは異なるファイルを編集する前提。共有ファイルを変更する場合は `[P]` を外すこと。
- すべてのテストは実装前に RED を確認し、実装後に GREEN を確認すること。
- Secrets は Cloudflare Pages Projects UI で更新し、ローカル `.dev.vars` に平文保存しない。
- 各ステップ後にコミットし、PR でレビューを受ける。
