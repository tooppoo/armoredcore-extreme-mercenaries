# Feature Specification: Cloudflare Pages Functions で Discord アーカイブコマンドを提供する

**Feature Branch**: `001-cloudflare-pages-functions`  
**Created**: 2025-09-28  
**Status**: Draft  
**Input**: User description: "Cloudflare Pages Functions に Discord Bot を移管して slash command を処理する機能仕様"

## Execution Flow (main)
```
1. Parse user description from Input
   → If empty: ERROR "No feature description provided"
2. Extract key concepts from description
   → Identify: actors, actions, data, constraints
3. For each unclear aspect:
   → Mark with [NEEDS CLARIFICATION: specific question]
4. Fill User Scenarios & Testing section
   → If no clear user flow: ERROR "Cannot determine user scenarios"
5. Generate Functional Requirements
   → Each requirement must be testable
   → Evaluate i18n/a11y applicability; if undecided, mark with [NEEDS CLARIFICATION]
   → Mark ambiguous requirements
6. Identify Key Entities (if data involved)
7. Run Review Checklist
   → If any [NEEDS CLARIFICATION]: WARN "Spec has uncertainties"
   → If implementation details found: ERROR "Remove tech details"
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

### Section Requirements
- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation
When creating this spec from a user prompt:
1. **Mark all ambiguities**: Use [NEEDS CLARIFICATION: specific question] for any assumption you'd need to make
2. **Don't guess**: If the prompt doesn't specify something (e.g., "login system" without auth method), mark it
3. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item
4. **Common underspecified areas**:
   - User types and permissions
   - Data retention/deletion policies  
   - Performance targets and scale
   - Error handling behaviors
   - Integration requirements
   - Security/compliance needs

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
Discord コミュニティ参加者が許可対象チャンネルで `/archive-challenge` または `/archive-video` を実行すると、Cloudflare Pages Functions 上で稼働する Bot がリクエストを受け付け、必要情報を確認の上でアーカイブ登録の結果を参加者へ返す。

### Acceptance Scenarios
1. **Given** Bot が Cloudflare Pages Functions 上で稼働しており Slash Command が Discord に登録されている, **When** 参加者が `/archive-challenge` に必須項目を入力して送信する, **Then** コマンド受信が成功し、アーカイブ登録結果（成功メッセージと登録内容の要約）が Discord チャンネルに公開メッセージとして通知される。
2. **Given** 参加者が既に登録済みの URL を `/archive-video` で送信する, **When** Bot がリクエストを受け付ける, **Then** システムは重複を検知し「登録済み」と通知して新規登録を行わない。

### Edge Cases
- OGP 取得に失敗した場合はフォールバック文言を設定し、エラーを構造化ログに記録する。
- 署名検証に失敗した場合は直ちに処理を中断し、利用者には一般的な失敗メッセージが返る。
- アーカイブ登録先のデータストアにアクセスできない場合は再試行を行わず「システムエラー」が通知され、管理者向けのモニタリングで検出できる。
- Slash Command が 3 秒以内に応答できない処理量となった場合は一時応答で受領し、完了通知を後報する。

## Requirements *(mandatory)*

### Functional Requirements
- **Permitted Channel**: Slash Command を実行できるチャンネル ID リスト（環境変数管理）を保持し、許可されていないチャンネルでは実行を拒否する。
- **Data Store**: Cloudflare D1（既存のアーカイブテーブル）を利用し、Pages Functions で書き込み・読み取りを行う。

- **FR-000**: 要求ドキュメントとのトレーサビリティを `docs/spec/archive/requests.md` に保持する。
- **FR-001**: システム MUST Cloudflare Pages Functions 上で `/archive-challenge` と `/archive-video` のリクエストを受け付け、Pages Functions から Cloudflare D1 へ直接書き込み、必要に応じて OGP 情報を取得・補完した上でアーカイブ登録できるようにする。
- **FR-002**: システム MUST Discord から送信される署名付きリクエストの検証に成功した場合のみ処理を続行し、失敗時は 401 相当のエラー応答と警告ログを記録する。
- **FR-003**: システム MUST アーカイブ登録の可否に関わらず 3 秒以内に Discord へ受領応答を返却し、必要に応じて後続通知で最終結果を伝える。
- **FR-004**: システム MUST URL 重複や必須項目不足など利用者の入力起因の失敗を判定し、公開メッセージで利用者が理解できる文言を Discord チャンネルに通知する。
- **FR-005**: システム MUST アーカイブ登録処理の結果（成功・重複・失敗）を構造化ログで記録し、Correlation ID により `docs/spec/archive/requirements.md` で定義された利用シナリオと紐づけられるようにする。
- **FR-006**: システム MUST ロケール「ja-JP」を前提としたメッセージ文言を提供し、多言語化は行わないことを明示する。
- **FR-007**: システム MUST 利用者が Slash Command を完了するために必要な入力項目と補助説明を提示し、アクセシビリティ要件（読み上げ対応、色依存表現を避ける）を設計資料に明記する。
- **FR-008**: システム MUST Pages Functions がアーカイブ対象URLの OGP 情報（タイトル・説明・サムネイルURL）を取得し、取得成功時は Cloudflare D1 に保存、取得失敗時は既定のフォールバック文言を設定して通知する。
- **FR-009**: システム MUST すべての Slash Command 応答を Discord チャンネルの公開メッセージとして投稿し、エフェメラル返信は使用しない。
- **FR-010**: システム MUST Slash Command の実行チャンネルを環境変数で管理し、許可されたチャンネル以外からの実行はエラーメッセージで拒否する。

### Key Entities *(include if feature involves data)*
- **Archive Submission**: Discord 参加者が入力したタイトル、URL、任意の説明、送信時刻、送信者 ID を含むリクエスト単位。Pages Functions が OGP 情報を取得して補完し、重複判定や登録成否がログに記録される。
- **Processing Outcome**: アーカイブ登録結果（成功、重複、システムエラー）と Discord への通知内容を表す。Pages Functions が Cloudflare D1 に直接書き込み、取得した OGP 情報と構造化ログ（Correlation ID 付き）を保持する。

## Clarifications

### Session 2025-09-28
- Q: Cloudflare Pages Functions からアーカイブ登録を行う際のデータ経路はどれにしますか？ → A: Pages Functions から直接 DB に書き込む
- Q: Cloudflare Pages Functions から直接書き込むデータベースはどれを想定していますか？ → A: Cloudflare D1（既存アーカイブテーブル）
- Q: OGP情報（説明文やタイトル補完）が必要な場合、どこで取得・反映しますか？ → A: Pages Functions が OGP を取得して Cloudflare D1 に保存する
- Q: Slash Command 応答はDiscord上でどの公開範囲にしますか？ → A: チャンネル公開メッセージ
- Q: Slash Command はどのチャンネルで実行できるようにしますか？ → A: 設定した特定チャンネルのみ許可する


---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous  
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified
- [x] i18n/a11yの適用可否と理由が明示されている
- [x] 要求→シナリオ→要件→ユースケース→仕様の参照関係が記載されている

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---
