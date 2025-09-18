import type { LoaderFunctionArgs } from 'react-router'
import { origin } from '~/lib/constants'
import { records as updateRecords } from '~/lib/updates/repository/record.server'

/**
 * 更新履歴（Updates）詳細ページ用 子sitemap
 * - 各更新エントリの詳細ページを列挙
 * - lastmod はエントリの作成日時
 * - ETag/Last-Modifiedによるキャッシュ最適化対応
 */
export async function loader({ request }: LoaderFunctionArgs) {
  // flatten all updates
  const updates = updateRecords.flat()

  // 最新の更新日時を取得（Last-Modified用）
  const lastModified =
    updates.length > 0
      ? updates.reduce(
          (latest, u) => (u.createdAt > latest ? u.createdAt : latest),
          updates[0].createdAt,
        )
      : null

  // ETag生成（更新数とハッシュベース）
  const base = JSON.stringify({
    count: updates.length,
    latest: lastModified?.getTime() || 0,
  })
  const hash = await stableHash(base)
  const etag = `W/"${hash.substring(0, 32)}"`
  const cacheControl = computeCacheControl(lastModified)

  // 条件付きGET判定
  const ifNoneMatch = request.headers.get('If-None-Match')
  if (ifNoneMatch && weakMatch(ifNoneMatch, etag)) {
    return new Response(null, {
      status: 304,
      headers: buildHeaders({ etag, lastModified, cacheControl }),
    })
  }

  const parts: string[] = []
  parts.push('<?xml version="1.0" encoding="UTF-8"?>')
  parts.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')

  for (const u of updates) {
    const loc = `${origin}/updates/${u.externalId}`
    const lastmod = new Date(u.createdAt).toISOString()
    parts.push('<url>')
    parts.push(`<loc>${loc}</loc>`)
    parts.push(`<lastmod>${lastmod}</lastmod>`)
    parts.push('</url>')
  }

  parts.push('</urlset>')

  return new Response(parts.join(''), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      ...buildHeaders({ etag, lastModified, cacheControl }),
    },
  })
}

function buildHeaders(args: {
  etag: string
  lastModified: Date | null
  cacheControl: string
}): HeadersInit {
  return {
    ETag: args.etag,
    ...(args.lastModified
      ? { 'Last-Modified': args.lastModified.toUTCString() }
      : {}),
    'Cache-Control': args.cacheControl,
  }
}

function computeCacheControl(lastModified: Date | null): string {
  if (!lastModified)
    return 'public, max-age=300, s-maxage=3600, stale-while-revalidate=60'

  const TEN_MINUTES = 10 * 60
  const ONE_DAY = 24 * 60 * 60
  const ONE_WEEK = 7 * ONE_DAY

  const ageSec = Math.max(
    0,
    Math.floor((Date.now() - lastModified.getTime()) / 1000),
  )
  let sMaxAge = 300 // <10m fallback
  if (ageSec >= ONE_WEEK) sMaxAge = ONE_WEEK
  else if (ageSec >= ONE_DAY) sMaxAge = ONE_DAY
  else if (ageSec >= TEN_MINUTES) sMaxAge = 3600
  const maxAge = Math.min(300, sMaxAge) // browsers: keep shorter
  const swr = Math.min(600, Math.floor(sMaxAge / 5) || 60)
  return `public, max-age=${maxAge}, s-maxage=${sMaxAge}, stale-while-revalidate=${swr}`
}

function weakMatch(ifNoneMatch: string, etag: string): boolean {
  // Handle multiple ETags, wildcard, and weak/strong variations
  const candidates = ifNoneMatch
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (candidates.includes('*')) return true
  // accept both exact and without W/ prefix comparisons
  const bare = etag.replace(/^W\//, '')
  return candidates.some((c) => c === etag || c === bare)
}

async function stableHash(input: string): Promise<string> {
  // Prefer Web Crypto (Workers), fallback to Node crypto for tests
  try {
    if (typeof crypto !== 'undefined' && 'subtle' in crypto) {
      const data = new TextEncoder().encode(input)
      const digest = await crypto.subtle.digest('SHA-256', data)
      return [...new Uint8Array(digest)]
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
    }
  } catch (e) {
    console.error(e)
  }
  try {
    const { createHash } = await import('node:crypto')
    return createHash('sha256').update(input).digest('hex')
  } catch (e) {
    console.error(e)
    // ultra-fallback (non-crypto): FNV-1a 32-bit
    let h = 0x811c9dc5
    for (let i = 0; i < input.length; i++) {
      h ^= input.charCodeAt(i)
      h = Math.imul(h, 0x01000193)
    }
    return (h >>> 0).toString(16).padStart(8, '0')
  }
}
