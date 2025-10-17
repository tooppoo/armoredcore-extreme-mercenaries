# Implementation Plan: Cloudflare Pages Functions Discord アーカイブ Bot

**Branch**: `001-cloudflare-pages-functions` | **Date**: 2025-09-28 | **Spec**: [/specs/001-cloudflare-pages-functions/spec.md](/specs/001-cloudflare-pages-functions/spec.md)
**Input**: Feature specification from `/specs/001-cloudflare-pages-functions/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Discord の `/archive-challenge` と `/archive-video` コマンドを Cloudflare Pages Functions 上で処理し、署名検証後に Cloudflare D1 へ直接書き込みを行う。Pages Functions が OGP 情報を取得・補完し、許可チャンネル限定で公開メッセージを返す。構造化ログと相関IDで追跡し、Secrets・依存管理・テストを憲章準拠で整備する。

## Technical Context
**Language/Version**: TypeScript 5.9.x（Cloudflare Workers Runtime, ESM）  
**Primary Dependencies**: Cloudflare Pages Functions Runtime、`@noble/ed25519`（署名検証、固定バージョン導入予定）、`undici`（OGP 取得）、`worktop/kv` 等既存ユーティリティの再利用検討  
**Storage**: Cloudflare D1（アーカイブ既存テーブルへの read/write バインディング）  
**Testing**: Vitest + `@cloudflare/vitest-pool-workers` / Miniflare による統合テスト、Coverage レポート継続  
**Target Platform**: Cloudflare Pages（Workers runtime, global edge）  
**Project Type**: web（`packages/front` にフロント＋Functions 集約）  
**Performance Goals**: Discord ACK < 1s、Slash Command 完了 < 3s、OGP 取得 95%tile < 2s、D1 クエリ < 100ms p95  
**Constraints**: Discord 署名検証必須、Secrets は Pages プロジェクトで管理、許可チャンネル以外は拒否、公開メッセージのみ、OGP 取得失敗時フォールバック  
**Scale/Scope**: Slash Command 想定 100 リクエスト/分以下、日次アーカイブ登録 100 件程度、Cloudflare 無料枠内  
**User Input ($ARGUMENTS)**: 追加指定なし（コマンド経由情報なし）

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] 要求→シナリオ→要件→ユースケース→仕様→設計→実装→テストの連鎖が計画で担保されているか確認する（`docs/spec/archive/requests.md` → 本仕様 → 本計画 → /tasks → テストのリンクを維持）
- [x] テスト戦略がTDD、ユニット+E2E、カバレッジ可視化まで含むか確認する（署名検証/OGP ユニット → Miniflare 統合 → カバレッジ報告）
- [x] 構造化ログ・相関ID・マスキング方針が設計とテスト計画に反映されているか確認する（JSON ログ、interaction.id を correlationId として検証）
- [x] Secrets管理と依存脆弱性チェックの実施方法が計画に含まれているか確認する（Pages Secrets、`docs/checklist/add-dependency.md` に従う、`pnpm audit`）
- [x] PR運用、リリースノート、ADR更新方針が計画に織り込まれているか確認する（依存追加時は ADR 追記・CHANGELOG 更新、PR でレビュー）

## Project Structure

### Documentation (this feature)
```
specs/001-cloudflare-pages-functions/
├── plan.md              # /plan 出力（本ファイル）
├── research.md          # Phase 0 調査結果
├── data-model.md        # Phase 1 エンティティ定義
├── quickstart.md        # Phase 1 テスト手順
├── contracts/           # Phase 1 API/イベント契約
└── tasks.md             # /tasks で生成
```

### Source Code (repository root)
```
packages/front/
├── functions/
│   └── api/
│       └── discord/
│           ├── interactions.ts            # Cloudflare Pages Functions エントリ
│           └── __tests__/interactions.test.ts
├── app/                                   # 既存 UI
├── drizzle.config.ts                      # D1 スキーマおよびマイグレーション
├── wrangler.toml                          # Pages/Workers 設定
└── vitest.config.ts                       # テスト設定

packages/discord-bot/                      # 旧 Koyeb Bot（段階的廃止予定）
```

**Structure Decision**: Web モノレポ構成。Cloudflare Pages Functions（Discord Interactions）は `packages/front/functions/api/discord/` に配置し、テストは同ディレクトリ直下で Vitest（Miniflare プール）を用いて実行する。DB 容量節約のため新規テーブル/カラムは追加せず、既存アーカイブテーブルへ同期書き込みする（スキーマ拡張は行わない）。

## Phase 0: Outline & Research
1. 未確定要素の抽出
   - `@noble/ed25519` 導入バージョン固定と Cloudflare Workers での署名検証実装
   - Cloudflare Pages Functions から D1 への direct write ベストプラクティス（バインディング設定、トランザクション）
   - OGP 取得のタイムアウト/再試行戦略と `undici` 利用時の制約
   - Discord Slash Command 公開レスポンスのレート制限・メッセージフォーマット
2. `research.md` に以下を整理
   - Decision / Rationale / Alternatives
   - 署名検証・OGP 取得・D1 アクセス・Secrets 管理の実装ガイド
3. 調査完了 → `research.md` 参照

**Output**: [`/specs/001-cloudflare-pages-functions/research.md`](./research.md) に決定事項と論点を記録。NEEDS CLARIFICATION は残っていないことを確認済み。

## Phase 1: Design & Contracts
1. `data-model.md` にエンティティ（ArchiveSubmission, ProcessingOutcome, OGPMetadata）と検証ルール（必須項目、重複判定キー、OGP 取得失敗時のフォールバック）を定義。
2. `/contracts/discord-interactions.openapi.yaml` に Discord Interactions エンドポイント（`POST /api/discord/interactions`）のリクエスト/レスポンススキーマ、署名ヘッダー要件、エラーコードを記述。
3. Contract Tests 設計（Vitest）
   - 署名検証失敗時 401 を期待
   - `PING` ペイロードで即 `PONG`
   - `/archive-challenge` 正常系で deferred 応答 + D1 書き込み mock
   - OGP 取得失敗時のフォールバック文言を確認
4. quickstart.md に手動/自動テスト手順（Miniflare 起動、Discord Dev Portal テストコマンド、D1 検証、ログ確認）を記述。
5. `.specify/scripts/bash/update-agent-context.sh codex` を実行し、Codex 向け最新技術スタック情報（Cloudflare Pages Functions, D1, OGP 取得など）を追記。

**Output**: [`data-model.md`](./data-model.md)、[`contracts/discord-interactions.openapi.yaml`](./contracts/discord-interactions.openapi.yaml)、[`quickstart.md`](./quickstart.md)、Codex コンテキスト更新完了。

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- `data-model.md` の各エンティティ → モデル/DTO 実装とバリデーションタスク
- `contracts/discord-interactions.openapi.yaml` の各フロー → Contract テスト / 実装タスク
- `quickstart.md` のシナリオ → 統合テスト・手動検証タスク
- Secrets 設定・D1 バインド・OGP フォールバックなど運用タスクを追加

**Ordering Strategy**:
1. Contract テスト（署名検証／OGP 取得ユニット／D1 書き込みエミュレータ）
2. 型/モデル実装 → 署名検証ユーティリティ → コマンドディスパッチャ
3. OGP 取得、構造化ログ、公開メッセージ整形
4. Miniflare 統合テスト、手動 Quickstart の検証

**Estimated Output**: 26±2 個のタスク（並列可 ` [P]` を付与）。

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (tasks.md に従って実行)  
**Phase 5**: Validation（テスト／quickstart 実行、Discord 本番切替）

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| なし | - | - |

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented

---
*Based on Constitution v3.0.0 - See `/memory/constitution.md`*
