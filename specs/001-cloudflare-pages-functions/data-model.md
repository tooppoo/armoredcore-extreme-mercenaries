# Data Model: Cloudflare Pages Functions Discord アーカイブ Bot（最小構成）

## 方針

DB容量を節約するため、本機能では追加テーブルや新規カラムの導入を行わない。既存のアーカイブテーブル（challenge/video）をそのまま利用する。

## 既存テーブルの活用
- Slash Command で受け取った入力（必要に応じて OGP 補完後の `title` / `description` / `url`）を既存カラムへ保存する。
- 重複判定は `url`（必要に応じて種別）で実施し、既存のユニーク制約/インデックスを活用する。

## 非採用（今回導入しない補助エンティティ）
- ArchiveSubmission／ProcessingOutcome／OGPMetadata は導入しない。
  - 処理結果の監査は構造化ログ（JSON, correlationId=interaction.id）で担保。
  - OGP キャッシュは持たず、取得結果は既存カラムに反映するにとどめる。

## バリデーション・ルール
- URL は HTTPS のみ許可し、動画URLはサポート対象ドメイン（例: YouTube, ニコニコ）に限定。
- `title` は 1〜120 文字、`description` は 0〜512 文字。
- `channel_id` は許可リストに含まれている必要がある。
- 構造化ログは機微情報を含めず、`correlationId` など最小限の調査情報のみを出力する。

## マイグレーション指針
- なし（既存スキーマを流用する）。
