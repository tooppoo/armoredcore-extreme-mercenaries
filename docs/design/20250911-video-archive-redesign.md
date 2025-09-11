# 設計

- ポイント
  - 既存の共通クエリ `query.server.ts` に `s` を追加（動画専用パラメタだが、影響はデフォルト値で無害化）
  - 動画リポジトリで URL のドメインに基づく WHERE 条件を追加
  - UI はカード型を再レイアウト（アスペクト比固定、バッジ/日付の上部配置）

- 依存図（mermaid）
```mermaid
flowchart TD
  Route[/routes/archives/video.tsx/]
  Query[query.server.ts]
  Repo[video/list/repository/read.server.ts]
  Schema[(db/schema.server.ts)]

  Route -- parse --> Query
  Route -- call --> Repo
  Repo -- select --> Schema
```

- コンポーネント構成
  - `VideoArchives`（検索フォーム+一覧+ページング）
  - `ArchiveItem`（カード: バッジ/日付/サムネ/タイトル/説明）

