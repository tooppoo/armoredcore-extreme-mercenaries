# 仕様: SitemapのETag/TTL最適化（contents_revisions連動 + Conditional GET）

## 概要
- `/sitemap.xml`（およびインデックス/子サイトマップ）で、`contents_revisions` に基づき ETag/Last-Modified を算出。
- `If-None-Match` 受領時は弱いETag `W/"<hash>"` で比較し、一致なら 304 を返す。
- `Cache-Control` は更新頻度に応じて可変（動的TTL）。

## HTTP応答仕様
- 200 OK（本文あり）
  - `Content-Type: application/xml; charset=utf-8`
  - `ETag: W/"<hash>"`
  - `Last-Modified: <updated_at in GMT RFC1123>`
  - `Cache-Control: public, max-age=<m>, s-maxage=<s>, stale-while-revalidate=<swr>`
- 304 Not Modified（本文なし）
  - `ETag` を再送
  - `Last-Modified` を再送
  - `Cache-Control` を再送

## ETag/Last-Modified の算出
- `<hash>` は `contents_revisions.latest_revision` をベースに SHA-256 等で安定化（必要なら prefix を付与）。
- `Last-Modified` は `contents_revisions.updated_at` を RFC1123 で整形。
- 分割サイトマップでは領域別の最新リビジョンを集約してハッシュ化（順序と安定化を保証）。

## TTLポリシー（例）
- `age = now - updated_at`
- if `age < 10m`: `s-maxage=300`
- else if `age < 24h`: `s-maxage=3600`
- else if `age < 7d`: `s-maxage=86400`
- else: `s-maxage=604800`
- 併せて `stale-while-revalidate=60..600` を付与。

## 疑似コード（TypeScript）
```ts
export async function handleSitemap(req: Request, env: Env): Promise<Response> {
  const ifNoneMatch = req.headers.get('If-None-Match');
  const site = parseSitemapKind(new URL(req.url));

  const rev = await env.DB.prepare('SELECT latest_revision, updated_at FROM contents_revisions WHERE site = ? LIMIT 1')
    .bind(site.id)
    .first<{ latest_revision: string; updated_at: string }>();
  if (!rev) return new Response('Service Unavailable', { status: 503 });

  const etag = `W/"${stableHash(rev.latest_revision)}"`;
  const lastModified = toRfc1123(new Date(rev.updated_at));
  const cacheControl = computeCacheControl(new Date(rev.updated_at));

  if (ifNoneMatch && weakMatch(ifNoneMatch, etag)) {
    return new Response(null, {
      status: 304,
      headers: {
        ETag: etag,
        'Last-Modified': lastModified,
        'Cache-Control': cacheControl,
      },
    });
  }

  const body = await renderSitemap(site, env);
  return new Response(body, {
    status: 200,
    headers: {
      ETag: etag,
      'Last-Modified': lastModified,
      'Cache-Control': cacheControl,
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
```

## セキュリティ
- ETagは内部IDや連番をそのまま露出しない（`stableHash` で不可逆化）。
- 障害時の応答で内部情報（SQL/環境変数）を露出しない。

## トレーサビリティ
- `ETag` 内のハッシュは `contents_revisions.latest_revision` から一意に導出できる。
- ログには `site.id`, `etag`, `status`, `cacheControl` を記録。

## テスト戦略
- property-based testing
  - 同一 `latest_revision` で `ETag` が安定（同値である）。
  - 異なる `latest_revision` で `ETag` が異なる。
  - `updated_at` に対する `computeCacheControl` の単調性や境界値。
- sample-based testing
  - `If-None-Match` 一致で304、非一致で200。
  - 分割サイトマップで一部更新時に対象のみ `ETag` が変化。

