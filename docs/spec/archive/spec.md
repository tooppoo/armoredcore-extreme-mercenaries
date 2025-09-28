# チャレンジ/動画アーカイブ Discord コマンド登録: 仕様

## 対象ドキュメント

- 要求: `docs/spec/archive/requests.md`
- シナリオ: `docs/spec/archive/scenario.md`
- 要件: `docs/spec/archive/requirements.md`

## 概要

Discord スラッシュコマンド `/archive-challenge` と `/archive-video` を用いて参加者がチャレンジアーカイブと動画アーカイブを登録する。Bot がアプリケーション API（`POST /api/archives/challenge` / `POST /api/archives/video`）を呼び出し、結果に応じたメッセージをチャンネルへ公開投稿する。構造化ログと開発者向け通知でトレーサビリティと運用性を確保する。

## コマンド仕様

### Slash Command `/archive-challenge`

- 利用者: Discord 一般参加者
- 入力パラメータ（Discord のコマンドビルダーで設定）
  1. `title` (string, 必須)
  2. `url` (string, 必須)
  3. `description` (string, 任意)
- 利用チャンネル制約
  - 環境変数 `DISCORD_ALLOWED_CHALLENGE_ARCHIVE_CHANNEL_IDS`（カンマ区切り）で指定されたチャンネル ID のみで受け付ける
  - その他のチャンネルでは「このコマンドは許可されたチャンネルでのみ利用できます」を返し、処理を打ち切る
- 応答メッセージ（公開投稿）
  - 成功: `アーカイブに登録しました`
  - 重複 (`duplicated-url`): `登録済みのアーカイブなので、スキップしました`
  - サポート外 (`unsupported-url`): `サポート外のURLなのでスキップしました`
  - ネットワーク/Fetch失敗: `アーカイブ追加に失敗しました`
  - 500 エラー (`failed-get-ogp`, `unknownError`, 追加予定コード含む): `予期しないエラーが発生しました (コード: {errorCode})`（`errorCode` が欠落した場合は `unknown` を表示）

### Slash Command `/archive-video`

- 利用者: Discord 一般参加者
- 入力パラメータ
  1. `url` (string, 必須)
  2. `title` (string, 任意)
  3. `description` (string, 任意)
- 利用チャンネル制約
  - 環境変数 `DISCORD_ALLOWED_VIDEO_ARCHIVE_CHANNEL_IDS`（カンマ区切り）で指定されたチャンネル ID のみで受け付ける
  - その他のチャンネルでは「このコマンドは許可されたチャンネルでのみ利用できます」を返し、処理を打ち切る
- 応答メッセージ（公開投稿）
  - 成功: `アーカイブに登録しました`
  - 重複 (`duplicated-url`): `既にアーカイブ済みのURLなのでスキップしました`
  - サポート外 (`unsupported-url`): `サポート外のURLなのでスキップしました`
  - OGP 取得失敗 (`failed-get-ogp`): `アーカイブの情報を取得できませんでした`
  - ネットワーク/Fetch失敗: `アーカイブ追加に失敗しました`
  - 500 エラー（`unknownError` など）: `予期しないエラーが発生しました (コード: {errorCode})`

### 開発者通知

- 500 エラー発生時、`DISCORD_DEV_ALERT_CHANNEL_ID` で指定された開発者専用チャンネルへ通知を送信
- 通知メッセージ例
  - チャレンジ: `チャレンジアーカイブ登録でエラー (コード: failed-get-ogp, correlationId: 123...)`
  - 動画: `動画アーカイブ登録でエラー (コード: failed-get-ogp, correlationId: 123...)`
- 通知内容: `correlationId`, `errorCode`, Discord ユーザー、入力 URL など運用に必要な最小限情報
- 実装方式: `discord.js` の Bot クライアントから `client.channels.fetch(DISCORD_DEV_ALERT_CHANNEL_ID)` でテキストチャンネルを取得し `channel.send(...)` を実行
- 送信に失敗した場合は最大3回までリトライし、それでも失敗した場合はエラーログへフォールバックする

## Bot 実装仕様

### 処理フロー

1. Discord から Interaction を受信し `interaction.id` を `correlationId` として採用
2. コマンド入力値とユーザー情報を抽出
3. 許可チャンネル判定（コマンド種別に応じた `DISCORD_ALLOWED_*_ARCHIVE_CHANNEL_IDS`）
4. 上記をパラメータとして API（`/api/archives/challenge` または `/api/archives/video`）へ POST
5. API 応答ステータスと `errorCode` に応じてメッセージを決定
6. エラー時は必要に応じ開発者チャンネルへ通知

### API 呼び出し

- URL（コマンド種別に応じて切り替え）
  - `${FRONT_URL}/api/archives/challenge`
  - `${FRONT_URL}/api/archives/video`
- メソッド: POST
- ヘッダー
  - `Content-Type: application/json`
  - `Authorization: Bearer ${FRONT_AUTH_UPLOAD_ARCHIVE}`
  - `X-Correlation-ID: ${interaction.id}`
- ボディ

  ```json
  // チャレンジアーカイブ (type=link) の場合
  {
    "type": "link",
    "title": "...",
    "url": "...",
    "description": "...",  // オプショナル（未指定の場合は自動取得）
    "discord_user": {
      "id": "...",
      "name": "..."
    }
  }

  // チャレンジアーカイブ (type=text) の場合
  {
    "type": "text",
    "title": "...",
    "text": "...",       // テキスト本文
    "discord_user": {
      "id": "...",
      "name": "..."
    }
  }
  
  // 動画アーカイブの場合
  {
    "url": "...",
    "title": "...",
    "description": "...",
    "discord_user": {
      "id": "...",
      "name": "..."
    }
  }
  ```

- タイムアウト/リトライ: 既存の `frontRequestHandler` 実装に準拠（デフォルトタイムアウト、失敗時の再試行なし）

### 構造化ログ出力

- Bot 側 (`packages/discord-bot/src/lib/log.ts` 利用)
  - 許可外チャンネル呼び出し、API 応答、Fetch 失敗などを `correlationId`・`discordUserId` 付きで JSON 形式出力
  - 500 エラー発生時は `errorCode`・入力 URL・任意入力パラメータを含めたログを出力
- API 側
  - 論理エラー (`duplicated-url` 等) は構造化ロガーで `correlationId`・`errorCode` を記録
  - 500 エラーは `detail` を含め `level: "error"` で出力し Bot 側通知と突合できるようにする

## API 仕様（再掲）

- `POST /api/archives/challenge`
  - 認証: Bearer Token (`FRONT_AUTH_UPLOAD_ARCHIVE`)
  - 入力バリデーション: Zod スキーマ (`postChallengeArchiveBody`)
  - 処理概要
    1. URL 重複チェック (`findChallengeArchiveByURL`)
    2. サポート外 URL 判定 (`getOgpStrategyProvider`)
    3. OGP 取得成功時のみ description を設定（失敗で 500）
    4. `saveChallengeArchive` で D1 保存（正規化 URL）
    5. `updateChallengeArchiveListRevision` 呼出
  - 応答
    - 成功: 200 OK / ボディは `null`
    - 400: `unsupported-url`, `duplicated-url` など
    - 500: `failed-get-ogp`, `unknownError`, その他追加コード
- `POST /api/archives/video`
  - 認証: Bearer Token (`FRONT_AUTH_UPLOAD_ARCHIVE`)
  - 入力バリデーション: Zod スキーマ (`postArchiveBody`)
  - 処理概要
    1. URL 正規化と重複チェック (`findVideoArchiveByURL`)
    2. サポート外 URL 判定 (`getOgpStrategyProvider`)
    3. OGP 取得後にリクエスト値で上書き (`overrideArchiveContents`)
    4. `saveVideoArchive` で D1 保存
  - 応答
    - 成功: 200 OK / ボディは `null`
    - 400: `unsupported-url`, `duplicated-url`, `failed-get-ogp`（500 で返すケースもあり）
    - 500: `failed-get-ogp`, `unknownError`, その他追加コード

## 通知チャンネル設定

- 環境変数
  - `DISCORD_ALLOWED_CHALLENGE_ARCHIVE_CHANNEL_IDS`: チャレンジアーカイブ許可チャンネル ID 群
  - `DISCORD_ALLOWED_VIDEO_ARCHIVE_CHANNEL_IDS`: 動画アーカイブ許可チャンネル ID 群
  - `DISCORD_DEV_ALERT_CHANNEL_ID`: 500 エラー通知先チャンネル ID
  - `FRONT_URL`, `FRONT_AUTH_UPLOAD_ARCHIVE`: API 呼び出し用
- 追加想定
  - 通知を無効化するフラグ（例: `DISCORD_NOTIFY_ERRORS=false`）を将来導入する余地を残す

## セキュリティ

- 実行チャンネル判定・認証トークンは環境変数で管理しリポジトリに含めない
- ログにはトークンや個人情報を含めない（Discord ユーザー名は API 保存済みのためログには ID のみ原則とする。表示が必要な場合でもマスクを検討）

## テスト計画（仕様準拠）

- Bot ユニットテスト: メッセージマッピング、チャンネル判定、開発者通知の条件分岐（チャレンジ/動画両対応）
- API 統合テスト: 400/500 応答時の `errorCode` 出力とログ内容
- e2e テスト（Playwright 等）: Discord モックまたは Bot スタブで `/archive-challenge`・`/archive-video` の基本フロー確認
- 通知テスト: テスト用チャンネル ID を使い、通知フォーマットが期待通りか

## シーケンス図

```mermaid
sequenceDiagram
  participant User as Discord参加者
  participant Discord as Discord
  participant Bot as Discord Bot
  participant API as Application API
  participant DB as D1 Database
  participant Dev as Dev Channel
  participant Log as Structured Logs

  User->>Discord: /archive-(challenge|video)(...)
  Discord->>Bot: Interaction(correlationId)
  Bot->>API: POST /api/archives/(challenge|video) (X-Correlation-ID)
  API->>DB: Save Archive
  DB-->>API: OK
  API-->>Bot: 200 OK
  API->>Log: info/error (correlationId,...)
  Bot->>Log: info/error (correlationId,...)
  alt 500 Error
    API-->>Bot: 500 (errorCode)
    Bot-->>Discord: 予期しないエラー...(コード: errorCode)
    Bot->>Dev: 通知(errorCode, correlationId)
  else 非500応答
    Bot-->>Discord: 対応するメッセージ
  end
```

## コンポーネント図

![コンポーネント図](./images/component.svg)

<details>

```plantuml
@startuml
'--- スキンパラメータなどの設定例 ---
skinparam defaultFontName "Meiryo"         ' 日本語表示用フォント例
skinparam componentStyle rectangle
skinparam maxMessageSize 80

'--- コンポーネント定義 ---
component "Koyeb\n<img:https://lh3.googleusercontent.com/p/AF1QipPA3ov75cU1ue8kWgr0GCRTii37VBxj177TVvqT=s1360-w1360-h1020{scale=0.1}>" as koyeb {
  component "Hono\n<img:https://avatars.githubusercontent.com/u/98495527?s=200&v=4{scale=0.3}>" as hono {
    [Discord Bot] as discordbot
  }
}

component "Cloudflare\n<img:https://cf-assets.www.cloudflare.com/slt3lc6tev37/fdh7MDcUlyADCr49kuUs2/5f780ced9677a05d52b05605be88bc6f/cf-logo-v-rgb.png{scale=0.1}>" as cloudflare {
  component "Remix" as Remix {
    [Archiveアプリ] as archive
  }
  database "Cloudflare D1" as db
}

component "OGP Scanner" as ogpScanner
component "YouTube Data API\n<img:https://developers.google.com/static/site-assets/logo-youtube.svg{scale=0.3}>" as youtubeAPI

[Discord] as discord

'--- アクター定義 ---
actor "一般ユーザー" as user
actor "管理者" as admin

'--- インターフェース ---
interface "Webhook API" as webhook
interface "Web UI" as web_ui
interface "Admin UI" as admin_ui

'--- 関連 ---
discord -- discordbot : メッセージ監視
discordbot -> webhook : 新規URL通知
webhook -> archive : URL通知

archive --> youtubeAPI : 情報取得
archive --> ogpScanner : 情報取得
archive -> db : OGP保存/取得

discordbot -> discord : 保存完了通知

user --> web_ui
web_ui --> archive : アクセス
admin --> admin_ui
admin_ui --> archive : アクセス/管理

'--- メモ ---
note bottom of archive
  - URLからOGP抽出
  - DB保存(Cloudflare D1)
  - アーカイブ管理
end note

note bottom of db
  - アーカイブ情報(OGPなど)
end note
@enduml
```

</details>
