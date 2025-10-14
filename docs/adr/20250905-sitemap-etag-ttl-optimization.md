# SitemapのETag/TTL最適化を `contents_revisions` と Conditional GET で実現

- ステータス: 承認済み
- 日付: 2025-09-05
- タグ: sitemap, caching, etag, ttl, cloudflare, d1

技術ストーリー: <https://github.com/tooppoo/armoredcore-extreme-mercenaries/issues/656>

## 背景 / 文脈

サイトマップ配信が常に200/本文返却になりやすく、トラフィック・レイテンシ・コスト面で非効率。Cloudflare Pages + D1 構成で、`contents_revisions` を変更検知のソースとし、条件付きGET(If-None-Match/If-Modified-Since)を活用して304を最大化したい。

## 決定ドライバ

- パフォーマンス/コスト最適化: 不要転送を避ける
- トレーサビリティ: 変更の根拠を `contents_revisions` で一意に追跡
- セキュリティ: 内部情報の露出回避（推測耐性のあるETag）
- 運用容易性: wrangler/Pagesでの一貫挙動

## 検討した選択肢

1. 弱いETag `W/\"<hash>\"`（`contents_revisions.latest_revision` を安定ハッシュ化）+ 動的TTL + Last-Modified 併用
2. 強いETag（本文ハッシュ）+ 固定TTL
3. Last-Modified のみ + 固定TTL
4. Cloudflare の手動/自動パージ中心の運用

## 決定（採択）

選択したオプション: "1. 弱いETag + 動的TTL + Last-Modified併用"。理由: 304命中を最大化しつつ、本文差分を計算せずに安定識別子を提供でき、更新頻度に応じたTTL最適化が可能。本文ハッシュ不要で計算量/リスク低減。

## 影響評価

- セキュリティ: ETagは安定ハッシュで内部IDを露出しない。障害時の詳細情報漏洩を防ぐ。
- パフォーマンス: 304比率向上により帯域/レイテンシ削減。D1参照は軽量クエリで抑制。
- ユーザー体験: クロール効率向上→インデックス鮮度改善が期待できる。
- アクセシビリティ: XML仕様/ヘッダ整合性維持により機械可読性を担保。
- トレーサビリティ: 応答/ログからリビジョンを追跡可能。

### ネガティブな影響 / トレードオフ

- ETagが本文を直接反映しないため、極端な生成バグを検出しづらい → 監視/テストで補完。
- 分割サイトマップ時は領域別リビジョン集約設計が必要。

## 各選択肢の利点と欠点

### 1. 弱いETag + 動的TTL + Last-Modified

- 良い点: 実装容易・計算軽量・304最大化・セキュア
- 良い点: 更新頻度適応のTTLで再クロール最適化
- 悪い点: 本文差分を示す強い整合性はない

### 2. 強いETag（本文ハッシュ）+ 固定TTL

- 良い点: 本文整合性が厳密
- 悪い点: 生成コスト・実装複雑、TTL最適化が難しい

### 3. Last-Modified のみ + 固定TTL

- 良い点: 実装最小
- 悪い点: 精度が粗く304命中率が下がる可能性

### 4. パージ中心運用

- 良い点: キャッシュ制御を単純化
- 悪い点: 手当が増えミスリスク、304効果を享受しづらい

## フォローアップ / 移行計画

- `/sitemap.xml` と分割子のハンドラにETag/TTLロジックを実装。
- `contents_revisions` の最新取得クエリと領域別集約のクエリ/ビューを定義。
- メトリクス: 200/304比率、帯域、応答時間、再クロール間隔を監視。

## 参考リンク

- Issue: <https://github.com/tooppoo/armoredcore-extreme-mercenaries/issues/656>
- HTTP ETag/Conditional Requests（RFC7232/9110）
