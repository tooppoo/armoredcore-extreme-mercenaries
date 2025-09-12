# 仕様

- 公開操作:
  - GET `/archives/video`（検索フォーム+一覧表示）
- 入力要件（クエリ）:
  - `k`: string 任意（空白区切りAND）
  - `o`: enum(`created.asc`|`created.desc`) 既定は降順
  - `s`: enum(`all`|`yt`|`x`|`nico`) 既定は `all`
  - `v`: enum(`card`|`list`) 既定は `card`（表示モード切替）
  - `p`: number(>=1) ページ番号
- 出力契約:
  - HTML: カード（サムネ aspect-video, ドメインバッジ, 登録日, タイトル, 説明）
  - ページングUIはクエリを保持
  - HTTPヘッダ: `Cache-Control`/`ETag` は現行を維持
- 制限事項:
  - 「動画サイト」はURLドメインのLIKE一致で判定（厳密なプラットフォーム判定は対象外）
  - 1ページ件数は現行(12)据え置き
  - 表示モードの種類はカード/リストの2種に限定（当面）
