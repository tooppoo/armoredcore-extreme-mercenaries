# Discord-Bot-Ping 仕様（最新）

## 概要
- 目的: Discord 用の Bot エンドポイントの稼働監視（ヘルスチェック）を行い、障害時のみ Slack に最小限の情報で通知する。
- ポリシー: レスポンス本文は通知に含めない。GitHub Actions の実行URLを含め、詳細調査は Run 画面へ誘導する。

## スコープ
- 対象: Discord-Bot-Ping のヘルスチェック実行と失敗時通知（Slack）
- 非対象: Bot 機能そのもの、デプロイフロー、スケジュール以外の監視

## スケジュール / 実行
- 毎30分で実行（GitHub Actions `schedule`）。
- 監視対象 URL はリポジトリ変数 `DISCORD_BOT_URL` を参照。

## 成否判定
- 成功: HTTP ステータス 200 を受領し、メッセージは `ok`。
- 失敗: 以下のいずれか
  - `curl` が失敗（ネットワーク/名前解決など）: `message = curl request failed`
  - HTTP ステータスが 200 以外: `message = non-200 response`

## 通知仕様（Slack）
- 送信条件: 失敗時のみ（上記いずれか）。
- 送信先: `SLACK_ALERT_WEBHOOK`（未設定なら通知スキップ、ジョブは成功扱い）。
- ペイロード（Block Kit）:
  - Header: `Discord-Bot-Ping Failed`
  - Fields: `Time`（UTC ISO8601）, `Status`（文字列）, `Message`（文字列）, `Run URL`（GitHub Actions 実行URL）
  - 備考: レスポンス本文は含めない。

## 非機能要件（NFR）
- セキュリティ: 機微情報（トークン・個人情報・内部URL等）を通知本文に含めない。
- パフォーマンス: 実行は軽量（単一 HTTP リクエスト、JSON 組立）。
- ユーザー体験: 必要最小限の情報で障害検知。詳細は Run URL から確認。
- アクセシビリティ: Slack Block Kit で視認性・読みやすさを担保。
- トレーサビリティ: Run URL を必須項目として含める。

## エラーハンドリング/境界条件
- `SLACK_ALERT_WEBHOOK` 未設定: 通知をスキップし、ステップ成功で継続。
- `Run URL` の生成不可: 当該フィールドを省略（他項目は通知続行）。

## 運用
- 誤検知防止: 一過性のネットワーク障害への対策として、将来的に短いリトライ導入を検討可。
- 変更管理: 仕様変更時は本ドキュメント更新と ADR 追加を行う。
