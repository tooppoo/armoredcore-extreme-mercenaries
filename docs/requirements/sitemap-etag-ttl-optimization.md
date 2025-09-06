# SitemapのETag/TTL最適化: 要件

## 機能要件（Functional）
- FR-1: `/sitemap.xml`（および分割時の子サイトマップ）で ETag を返す。
- FR-2: If-None-Match を受け取り、最新リビジョンと一致する場合は 304 を返す。
- FR-3: Last-Modified / If-Modified-Since を併用可能な形で返す（精度に差があればETag優先）。
- FR-4: `contents_revisions` の最新状態から、安定的な ETag 値（弱いETag `W/"<hash>"` 推奨）を算出する。
- FR-5: `Cache-Control` を更新頻度に応じて可変設定できる（s-maxage, max-age, stale-while-revalidate）。
- FR-6: 分割サイトマップ（インデックス+子）構成に対応し、子ごとにETag/Last-Modifiedが算出される。
- FR-7: エラーパス時のフォールバック方針（直近値のキャッシュ使用 or 明示的エラー）。

## 非機能要件（Non-Functional）
- NFR-1: パフォーマンス: 更新なしアクセス時、本体転送ゼロ（304）比率を高める。
- NFR-2: セキュリティ: ETagに内部機密情報を含めない。推測耐性を確保。
- NFR-3: 可観測性/トレーサビリティ: 応答ヘッダ/ログにリビジョン識別子を残し原因追跡を容易に。
- NFR-4: 運用性: wrangler dev/preview/production の挙動差を最小化。
- NFR-5: 互換性: 既存のサイトマップ仕様/URL構造を変更しない（必要時は別途合意）。

## 入出力インタフェース
- 入力: HTTPヘッダ `If-None-Match`, `If-Modified-Since`、D1クエリ（`contents_revisions`）。
- 出力: HTTPステータス `200/304`、`ETag`, `Last-Modified`, `Cache-Control`, `Content-Type: application/xml`。

## データ要件
- `contents_revisions`（例）:
  - `latest_revision`（ハッシュ or インクリメント番号）
  - `updated_at`（タイムスタンプ）
  - 必要に応じて領域別の最新情報（分割用）。

## 制約
- Cloudflare Pages + D1 のみ。外部依存は最小限。
- ライブラリ選定は小依存・活発開発・TS対応を優先。

## 検証基準
- 条件付きGETのユニット/統合テストで200/304切替が正しく行われる。
- 更新直後と安定期間で `Cache-Control` のポリシーが変化する。
- 大規模分割時に、更新領域のみ200となる。

