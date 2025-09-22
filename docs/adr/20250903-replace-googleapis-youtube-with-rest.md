# @googleapis/youtube を REST fetch 実装に置換する

- ステータス: 承認済み
- 日付: 2025-09-03
- タグ: Cloudflare Workers, YouTube API, 依存整理

技術ストーリー: Cloudflare Workers 環境で発生したランタイム非互換を解消し、デプロイ失敗を防ぐための依存置換を決定する。

## 背景 / 文脈

Renovate により `@googleapis/youtube` v28 へ更新したところ、Cloudflare Pages Functions でデプロイ時に例外が発生した。原因は依存チェーンにある `google-logging-utils` → `gcp-metadata` が Node.js 固有の API を利用していることで、Workers 実行環境と互換性がなかった。

## 決定ドライバ

- Workers 上で Node.js 固有 API に依存しない実装が必要。
- 既存の OGP 取得処理（`withYouTubeData`）の動作を維持したい。
- 依存アップデートによる再発を防ぎたい。

## 検討した選択肢

1. `@googleapis/youtube` を削除し、YouTube Data API v3 を `fetch` で直接呼び出す（採択）。
2. 旧バージョンにピン留めし、Workers 互換のパッチを待つ。
3. 代替ライブラリ（`googleapis` 全体など）を検討する。

## 決定（採択）

`@googleapis/youtube` の利用を廃止し、REST API を直接 `fetch` で呼び出す実装へ置換する。これにより Workers 環境での依存互換性問題を解消しつつ、機能を維持する。

## 影響評価

### ポジティブな影響

- Workers でのデプロイ失敗を解消し、互換性問題の再発リスクを下げられる。
- 依存チェーンが短くなり、脆弱性や非互換の検知が容易になる。

### ネガティブな影響

- REST 呼び出しの署名・クエリ構築を自前で維持管理する必要がある。
- Google API の仕様変更時に手動で追随するコストが増える。

## その他検討事項

- 旧バージョンのピン留めは短期的な回避策に留まり、将来のアップデートで再発する懸念が残る。
- 代替ライブラリも多くが Node.js API 前提であり、Workers 互換性の担保が難しい。
