# ユースケース: Sitemap ETag/TTL最適化

## アクター
- クローラ（検索エンジン）
- 管理者（コンテンツ投稿/更新）
- システムタイマー（バッチ/スケジューラ）

## ユースケース図
```mermaid
usecaseDiagram
actor Crawler
actor Admin
actor "System Timer" as Timer

Crawler -- (UC1: 条件付きGETでSitemap取得)
Admin -- (UC2: コンテンツ更新→リビジョン更新)
Timer -- (UC3: 更新頻度に応じたTTL再計算)

(UC2: コンテンツ更新→リビジョン更新) ..> (UC3: 更新頻度に応じたTTL再計算) : triggers
(UC3: 更新頻度に応じたTTL再計算) ..> (UC1: 条件付きGETでSitemap取得) : influences TTL
(UC2: コンテンツ更新→リビジョン更新) ..> (UC4: サイトマップ分割と部分ETag) : affects subset
(UC4: サイトマップ分割と部分ETag) ..> (UC1: 条件付きGETでSitemap取得)

usecase UC4 as "UC4: サイトマップ分割と部分ETag"
```

## エンティティ / バウンダリ / コントロール
- エンティティ: `Revision`, `Sitemap`, `CacheHeaders`
- バウンダリ: HTTPハンドラ(`/sitemap.xml`), D1(RevisionSource), KV(MetadataStore)
- コントロール: `ETagCalculator`, `CachingPolicy`, `SitemapRenderer`

## 主要フロー
- UC1: クローラが `If-None-Match` を付与→D1で最新Revision取得→一致なら304、相違なら200+新ETag。
- UC2: 管理者が投稿→`contents_revisions` に反映→最新Revisionが更新。
- UC3: 経過時間/更新頻度により `Cache-Control` を再計算（動的TTL）。
- UC4: 分割サイトマップ単位で影響領域のみETagを更新。
