# ADR: Discord-Bot-Ping 通知からレスポンス本文を除外し、実行URLを追加する

Date: 2025-09-03

## Context
- 過去に GitHub Actions の出力書式不備により、200/ok でも `failure()` が発火し誤通知が発生した。
- 現行通知はレスポンス本文を含めうるため、機微情報露出と可読性低下の懸念がある。
- 一方で、原因調査には実行の詳細ログ（GitHub Actions Run）の参照が有効。

## Decision
1. 通知からレスポンス本文を除外する。
2. 通知に GitHub Actions の実行URL（Run URL）を追加する。
3. 通知条件は「非200」または「リクエスト失敗」に限定する（200/ok は通知しない）。

## Status
Accepted

## Consequences
- Security: 機微情報が Slack に拡散するリスクを低減。
- UX: 通知の要点が明確化（Status/Message/Run URL）し、可読性が向上。
- Traceability: Run URL により、詳細ログへの遷移が容易になり調査が迅速化。
- Diagnostics: レスポンス本文が通知に無い分、一次情報は Run 画面へ誘導される（設計上のトレードオフ）。

## Alternatives Considered
- A) 本文をトリミングして通知（1800文字など）
  - 機微情報の露出可能性は残る。ノイズも大きい。
- B) 本文のハッシュのみ通知
  - ハッシュでは実用的な調査手掛かりになりにくい。
- C) 本文はアーティファクト/ログに保存、通知は URL のみ
  - 本決定と整合。通知簡素化と追跡性の両立。

## Implementation Notes (非機能)
- Block Kit のフィールドに `Time/Status/Message/Run URL` を表示。
- `Run URL`: `${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}`
- 将来的にリトライやタイムアウト設定、Webhook 未設定時の graceful スキップを維持。
