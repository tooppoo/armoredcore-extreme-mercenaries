# Research: Cloudflare Pages Functions Discord アーカイブ Bot

## 概要
- 入力仕様: `/specs/001-cloudflare-pages-functions/spec.md`
- ゴール: Discord Slash Command（`/archive-challenge`, `/archive-video`）を Cloudflare Pages Functions で処理し、直接 Cloudflare D1 に記録する。
- 重点調査項目: 署名検証（Ed25519）、Pages Functions から D1 への書き込み、OGP 取得方針、Secrets・ログポリシー。

## 調査結果

### Decision: Cloudflare Pages Functions から Cloudflare D1 へ直接書き込む（最小構成）
- **Rationale**: Pages Functions は Workers Runtime と同等の D1 バインディングをサポートし、`env.DB.prepare().bind().run()` を利用できる。API を経由しないことで往復遅延と Secrets 共有を削減し、可逆性（将来 Worker へ分離）も維持できる。DB 容量を節約するため、新規テーブルや追加カラムは導入しない。
- **Alternatives**:
  - Front API 経由の REST 呼び出し: レイテンシと Secrets 増加がデメリット。
  - Workers Durable Object: 状態管理は不要でコスト増となる。

### Decision: Discord 署名検証に `@noble/ed25519@3.0.0` を採用
- **Rationale**: Cloudflare Workers 対応実績が多く、`Uint8Array` での検証が可能。バンドルサイズも小さく、Pages Functions での実行に支障がない。固定バージョン（3.0.0）で導入し、`docs/checklist/add-dependency.md` に沿って承認を記録する。
- **Alternatives**:
  - `tweetnacl`: ランタイム互換はあるがメンテナンス頻度が低い。
  - WebCrypto SubtleCrypto: Ed25519 は Workers でまだ標準提供されない。

### Decision: OGP 取得は `undici`（Workers 組込み fetch）で 2 秒タイムアウトを設定（保存は既存カラムのみ）
- **Rationale**: Workers の `fetch` はデフォルト 15 秒だが、Discord ACK 要件から 2 秒での切り上げが望ましい。`AbortController` で 2 秒経過したら中断し、フォールバック文言を適用する。取得結果の永続化は既存アーカイブテーブルの `title` / `description` などに反映する範囲にとどめる（専用の OGP キャッシュテーブルは持たない）。
- **Alternatives**:
  - ライブラリ `@extractus/article-extractor`: サイズが大きく過剰。
  - 取得を別 Worker に委譲: 初期スコープ外。

### Decision: 構造化ログは `console.log(JSON.stringify({...}))` ベースで info/warn/error を区別
- **Rationale**: Workers でのログは文字列出力のみのため、レベルと correlationId を JSON フィールドに含める。interaction.id を `correlationId` として統一し、機微情報（トークン等）は出力しない。
- **Alternatives**:
  - 既存ロガー導入: 追加依存を避けたい。

### Decision: Secrets 管理と D1 バインディング
- **Rationale**: Pages プロジェクトの環境変数として `DISCORD_PUBLIC_KEY`, `DISCORD_BOT_TOKEN`, `D1_DB` バインディングを設定。プレプロダクション/本番を分離し、最小権限で運用。
- **Alternatives**:
  - Wrangler CLI で直接管理: Pages UI が既存運用方針。

### Decision: テスト戦略
- **Rationale**: Vitest + `@cloudflare/vitest-pool-workers` で Workers 環境のユニット/統合テストを実行し、Miniflare を活用して D1 を in-memory でエミュレート。署名検証・OGP 取得・チャンネル制限をユニットで、全体フローを integration で確認。
- **Alternatives**:
  - jest + cloudflare-worker-jest: プロジェクト標準が Vitest のため採用しない。

## 未解決事項
- なし（Clarifications により主要不確定要素は解消済み）。将来 Worker 分離やキュー導入が必要となった際に追加調査を行う。
