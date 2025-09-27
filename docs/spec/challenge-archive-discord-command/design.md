# チャレンジアーカイブ Discord コマンド登録: 設計

## 対象ドキュメント

- 要求: `docs/requests/challenge-archive-discord-command.md`
- シナリオ: `docs/scenario/challenge-archive-discord-command.md`
- 要件: `docs/requirements/challenge-archive-discord-command.md`
- 仕様: `docs/spec/challenge-archive-discord-command.md`

## 全体構成

- Discord Bot (`packages/discord-bot`)
  - コマンドハンドラ
  - API クライアント
  - ログ出力
  - 開発者通知
- アプリケーション API (`packages/front`)
  - `/api/archives/challenge` ルート
  - URL 重複・OGP 取得・保存処理
  - 構造化ログ

## ユースケース対応表

| ユースケース | 設計参照 | 備考 |
| --- | --- | --- |
| UC1 チャレンジアーカイブを登録する | Discord Bot 詳細 / API 詳細 / コンポーネント | コマンド実行から保存まで |
| UC2 500エラー時の開発者通知 | Discord Bot 詳細 > 開発者通知 / ログ | 500エラー検知と通知フロー |
| UC3 許可チャンネル設定を運用する | Discord Bot 詳細 > コマンドハンドラ / 環境変数一覧 | チャンネルID管理 |

## コンポーネント

```mermaid
flowchart LR
  subgraph Discord
    User[一般参加者]
    Bot[Discord Bot]
  end
  subgraph App
    API[API Route /archives/challenge]
    Service[Upload Functions]
    Repo[Repository (D1)]
  end
  subgraph Infra
    D1[(Cloudflare D1)]
  end
  subgraph Ops
    DevChan[開発者用Discordチャンネル]
    Logs[構造化ログ基盤]
  end

  User --> Bot
  Bot --> API
  API --> Service
  Service --> Repo
  Repo --> D1
  Service --> Logs
  Bot --> Logs
  Bot --> DevChan
```

## Discord Bot 詳細

### コマンドハンドラ

- ファイル: `packages/discord-bot/src/bot/commands/archive-challenge.ts`（新規）
- 役割: Interaction から入力値を取得し、許可チャンネル判定後に `frontRequest` を呼び出す
- 拡張: 許可チャンネル ID リストを環境変数からロード。複数対応

### API クライアント

- 既存 `frontRequestHandler` を拡張し、X-Correlation-ID ヘッダー・開発者通知フックを追加
- 応答の `errorCode` を取り出し、メッセージマッピングに利用（欠落時は `unknown` を利用）

### ログ

- ログメッセージ ID 案
  - `archive-command-start`
  - `archive-command-success`
  - `archive-command-duplicated`
  - `archive-command-unsupported`
  - `archive-command-error`
- 必須フィールド: `correlationId`, `discordUserId`, `channelId`, `title`, `url`
- エラー時: `errorCode`, `detail`
- 重複・サポート外など論理エラーは `level=info`
- 500、ネットワークエラーは `level=error`

### 開発者通知

- 役割: 500 エラー時に `DISCORD_DEV_ALERT_CHANNEL_ID` へメッセージ投稿
- 実装: Discord Bot のクライアント経由で `sendMessage`。テキスト例: `予期しないエラー (コード: failed-get-ogp, correlationId: ... , user: ...)`
- 送信失敗時は最大3回までリトライし、それでも失敗した場合は構造化エラーログに記録してフォールバックする
- アラート強化案（検討中）: 通知失敗や高頻度の500検知を検出したい場合は、Slack WebhookやOpsgenieなど既存のアラート基盤へ同内容をブロードキャストするハンドラを追加する

## アプリケーション API 詳細

### ミドルウェア

- `requireAuthToken` で Bearer 認証
- `X-Correlation-ID` ヘッダーを受け取りログに含める（存在しない場合は新規生成を検討）

### 業務ロジック

1. リクエストを Zod で検証
2. URL 重複チェック (`findChallengeArchiveByURL`)
3. サポート外 URL 判定 (`getOgpStrategyProvider`)
4. description 未入力時は OGP を取得し、失敗で `failed-get-ogp` を throw (500)
5. 保存処理 (`saveChallengeArchive`)
6. 成功時は 200

### ログ設計

- ロガー（Cloudflare Workers の `console.log` ラッパ）を利用し構造化 JSON を出力
- フィールド例: `{ level, message, correlationId, discordUserId, url, result: 'created' }`
- エラー時: `{ level: 'error', message: 'archive-challenge-error', correlationId, errorCode, detail }`
- 重複時: `{ level: 'info', message: 'archive-challenge-duplicated', correlationId, urlNormalized, existingUrl }`

## プライベート関数・ユーティリティ

- `parseAllowedChannelIds(envVar: string)` : string -&gt; Set&lt;string&gt;
- `buildCommandResponse(code)` : errorCode -&gt; message mapping
- `notifyDeveloper(channelId, payload)` : Discord API 呼び出し
- `logWithCorrelation(level, message, extra)` : 共通ロガー

## 環境変数一覧

| 変数名 | 用途 |
| --- | --- |
| `DISCORD_ALLOWED_CHALLENGE_ARCHIVE_CHANNEL_IDS` | コマンド許可チャンネル ID (カンマ区切り) |
| `DISCORD_DEV_ALERT_CHANNEL_ID` | 500 エラー通知先チャンネル |
| `FRONT_URL` | API 呼び出し先 |
| `FRONT_AUTH_UPLOAD_ARCHIVE` | API Bearer Token |
| `LOG_LEVEL` | Bot ログレベル |

> 運用メモ: 本番デプロイ前に `DISCORD_ALLOWED_CHALLENGE_ARCHIVE_CHANNEL_IDS` と `DISCORD_DEV_ALERT_CHANNEL_ID` を Secrets/環境変数に設定し、Slash コマンドを `pnpm --filter @ac-extreme-mercenaries/discord-bot run deploy:commands` で再登録する。

## エラーハンドリング設計

- API から 400 (`unsupported-url`, `duplicated-url`): Bot 側は info レベルでログし、ユーザー向けメッセージ返却
- API 500 (`failed-get-ogp`, `unknownError`): Bot 側で error ログ、開発者通知、ユーザーには共通メッセージ
- Fetch 失敗: Bot 側で error ログ (`FetchError`)、ユーザーに `アーカイブ追加に失敗しました`
- パースエラー（Discord Interaction 解析失敗）: `log('error', {...})` + 内部通知検討 (現状はログのみ)

## テーブル・データ影響

- D1 スキーマ変更はなし、既存 `challenge_archives` と `discord_members` に挿入
- `updateChallengeArchiveListRevision` により一覧キャッシュの更新

## 実装計画

| タスク | 内容 | 担当 | 備考 |
| --- | --- | --- | --- |
| T1 | Slashコマンド定義を更新し `deploy-commands` で登録する | Bot担当 | `/archive-challenge` の入力パラメータ設定 |
| T2 | コマンドハンドラ実装と許可チャンネル判定ロジックを追加 | Bot担当 | `DISCORD_ALLOWED_CHALLENGE_ARCHIVE_CHANNEL_IDS` を Set 化 |
| T3 | エラーメッセージ/ログ/開発者通知処理を実装 | Bot担当 | `client.channels.fetch` を用いた通知 |
| T4 | `frontRequestHandler` 拡張 (X-Correlation-ID ヘッダー、errorCode 伝搬) | Bot担当 | 既存呼び出し箇所への影響調査 |
| T5 | API で `X-Correlation-ID` 受領・ログ出力を追加、500/400 応答を整理 | Front担当 | `console.log` ラッパでJSON出力 |
| T6 | 重複/OGP 処理のログ詳細 (正規化 URL 等) を追加 | Front担当 | 既存 `findChallengeArchiveByURL` の戻り値利用 |
| T7 | ユニットテスト/統合テスト/e2e の整備 | Bot担当 + Front担当 | 下記テストケース詳細を参照 |
| T8 | 環境変数設定とドキュメント更新 (.env, README) | 運用担当 | 開発者チャンネルID・許可チャンネルID |

## テストケース詳細

| ID | シナリオ | 前提 | 手順 | 期待結果 |
| --- | --- | --- | --- | --- |
| TC1 | description あり正常登録 | 許可チャンネル / API 正常 | `/archive-challenge` に title/url/description 入力 | メッセージ「アーカイブに登録しました」、D1 に保存、ログ出力 |
| TC2 | description なし + OGP 成功 | OGP 取得可能な URL | description 未入力で送信 | OGP description が保存されメッセージ成功 |
| TC3 | description なし + OGP 失敗 | API 単体テストで OGP 取得モジュールをモック | 送信 | 「予期しないエラー (コード: failed-get-ogp)」、開発者通知送信、500 応答ログ |
| TC4 | URL 重複 | 既存 URL 登録済み | 同一URLで送信 | 「登録済みのアーカイブなので、スキップしました」、ログに raw/normalized/existing URL |
| TC5 | サポート外 URL | サポートパターン外 URL | 送信 | 「サポート外のURLなのでスキップしました」、400 応答 |
| TC6 | 許可外チャンネル | 許可リストに含まれないチャンネル | 同コマンド送信 | 警告メッセージ、API 未呼び出し、info ログ |
| TC7 | API ネットワーク障害 | API 呼び出し失敗をモック | 送信 | 「アーカイブ追加に失敗しました」、error ログ |
| TC8 | 複数チャンネル設定 | 環境変数に複数 ID 設定 | 各チャンネルでコマンド試行 | 許可チャンネルで成功、非許可で警告 |
| TC9 | 500 エラー `unknownError` | API が unknownError を返す | 送信 | 「予期しないエラー (コード: unknownError)」、開発者通知 |

- Bot 単体テスト: 許可チャンネル判定、エラーメッッセージマッピング、開発者通知呼び出し
- API 単体テスト: 重複判定・OGP 取得モック（APIモジュールで実施）・エラーコード返却
- 統合テスト: Bot -> API -> D1 の流れ（e2e テスト環境で）
- 通知テスト: テスト用 `DISCORD_DEV_ALERT_CHANNEL_ID` を設定し、メッセージフォーマット確認

## リスク・懸念

- 500 エラー多発時の通知スパム: 将来的に rate limit や集約機能検討
- OGP 取得時間が長い場合の Discord タイムアウト: 必要なら非同期登録や遅延応答検討
- 許可チャンネルリストの運用（チャンネル増減時の環境変数更新）

## Mermaid 図

```mermaid
classDiagram
  class CommandHandler {
    +handleInteraction(interaction)
    -isAllowedChannel(channelId)
    -buildRequestPayload()
  }

  class FrontRequest {
    +execute(payload)
    -mapResponseToMessage()
    -notifyDeveloper(error)
  }

  class ApiRoute {
    +action(request)
    -validate()
    -buildArchive()
    -save()
  }

  CommandHandler --> FrontRequest
  FrontRequest --> ApiRoute
  ApiRoute --> Repository
  Repository --> D1
```
