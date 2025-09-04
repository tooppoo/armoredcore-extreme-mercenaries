# Workers互換のため @googleapis/youtube を REST fetch に置換

- 日付: 2025-09-03

## 背景 / 文脈

- Renovate により `@googleapis/youtube` のメジャーアップデート（v28）が導入された結果、Cloudflare Pages Functions の公開時に例外が発生。
- 例外は `google-logging-utils` → `gcp-metadata` 依存の初期化コードに起因し、Workers 環境の Node 互換（`process.stderr` など）が限定的なためクラッシュする。
- E2E は API の認証失敗時の期待コード（401）が合っていないことでも落ちていたが、こちらはテスト修正で解消可能。一方、デプロイ失敗はランタイム非互換が根本原因。

参考情報:
- Cloudflare Docs: Node 互換は限定的で、多くの npm パッケージは実行時にエラーとなりうる。
  - “Many npm packages rely on APIs from the Node.js runtime, and will not work unless these Node.js APIs are available.”
  - https://developers.cloudflare.com/workers/runtime-apis/nodejs/
- 実例（googleapis/js-genai #324）: Workers で `google-logging-utils` 周りが原因で例外。 https://github.com/googleapis/js-genai/issues/324

## 決定（採択）

- `@googleapis/youtube` の利用を廃止し、YouTube Data API v3 を `fetch` で直接呼び出す実装に置換する。
- 対象箇所: `withYouTubeData`（OGP 取得戦略）。
- API エンドポイント: `GET https://www.googleapis.com/youtube/v3/videos?part=snippet&id={id}&key={API_KEY}`。
- 依存削減のため、`packages/front/package.json` から `@googleapis/youtube` を削除。

## 影響

- セキュリティ: 依存チェーンを縮小し攻撃面積を低減。API キーは Workers の変数/シークレットから注入。
- パフォーマンス: バンドル軽量化・初期化コスト低減。コールドスタート改善。
- ユーザー体験: デプロイの安定性向上。失敗時の制御が明瞭（HTTP ステータスに基づく処理）。
- トレーサビリティ: 直接 REST 呼び出しにより挙動が読みやすく、将来の API 変更にも追随しやすい。

## 却下した選択肢

1) 旧バージョンへのピン留め（例: 25.1.0）
- 長所: 迅速な復旧が可能。
- 短所: 依存が重く、将来の互換性/脆弱性リスクが残る。Workers 互換性の問題再発の懸念。

2) 動的 import やツリーシェイクで問題モジュールを除外
- 長所: 変更範囲が少ない可能性。
- 短所: ビルド設定/依存更新で再発しやすく、保守性とトレーサビリティが悪い。

## 実装メモ

- `withYouTubeData` 内で URL 正規化 → videoId 抽出 → YouTube Data API v3 を `fetch`。
- 取得した `snippet` から `title` / `description` / `thumbnails.high/std/maxres` を OGP 形式にマップ。
- 既存の公開 API（戻り値型/エラー文言）は極力維持。

## 追跡項目（今後の拡張）

- 429/5xx のバックオフ、短期キャッシュの検討（クォータ対策）。
- フォールバック戦略（OGP Scanner への切替）検討。

