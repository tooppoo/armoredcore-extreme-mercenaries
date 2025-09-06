import type { LoaderFunctionArgs } from 'react-router'
import type { D1Database } from '@cloudflare/workers-types'
import { origin } from '~/lib/constants'
import {
  getChallengeArchiveListUpdatedAt,
  getChallengeArchiveListRevision,
} from '~/lib/archives/challenge/revision/repository'
import {
  getVideoArchiveListUpdatedAt,
  getVideoArchiveListRevision,
} from '~/lib/archives/video/revision/repository'

/**
 * なぜ子sitemapに分割するのか（方針3-1）
 * - スケール: URL上限(5万)/サイズ上限(10MB)に対応しやすく、将来の分割・ページングが容易
 * - パフォーマンス: セクションごとにDB負荷・キャッシュ(TTL/ETag)を最適化可能
 * - 回復性: 一部の生成失敗が全体に波及しない（フェイルソフト）
 * - 追従性: ライブラリに依存しない標準的な構成で保守が容易
 */
export async function loader({ request, context }: LoaderFunctionArgs) {
  // 1) 最新の更新時刻（Last-Modified用）とリビジョン（ETag用）を取得
  const [revisions, errorRes] = await fetchRevisions(context.db as D1Database)
  if (errorRes) return errorRes
  const [challengeUpdatedAt, videoUpdatedAt, challengeRev, videoRev] = revisions

  // 2) Last-Modified は最大の更新時刻
  const lastMs = [challengeUpdatedAt, videoUpdatedAt]
    .filter((d): d is Date => Boolean(d))
    .map((d) => d.getTime())
    .reduce((a, b) => (a > b ? a : b), 0)
  const lastModified = lastMs ? new Date(lastMs) : null

  // 3) グローバルETag: 複数リビジョンを安定化して弱いETag化
  const base = JSON.stringify({ c: challengeRev ?? 0, v: videoRev ?? 0 })
  const hash = await stableHash(base)
  const etag = `W/"${hash.substring(0, 32)}"` // 16bytes(32hex)に短縮
  const cacheControl = computeCacheControl(lastModified)

  // 4) 条件付きGET判定
  const ifNoneMatch = request.headers.get('If-None-Match')
  if (ifNoneMatch && weakMatch(ifNoneMatch, etag)) {
    return new Response(null, {
      status: 304,
      headers: buildHeaders({
        etag,
        lastModified,
        cacheControl,
      }),
    })
  }

  // 5) 本文生成（従来と同等）
  const fmt = (d: Date | null) => (d ? d.toISOString() : undefined)
  const parts: string[] = []
  parts.push('<?xml version="1.0" encoding="UTF-8"?>')
  parts.push(
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  )

  // Core (静的/一覧ページ) 用の子sitemap
  parts.push('<sitemap>')
  parts.push(`<loc>${origin}/sitemap.core.xml</loc>`)
  if (lastModified)
    parts.push(`<lastmod>${lastModified.toISOString()}</lastmod>`)
  parts.push('</sitemap>')

  // Challenge 詳細の子sitemap
  parts.push('<sitemap>')
  parts.push(`<loc>${origin}/sitemap.challenge.xml</loc>`) // child sitemap for challenge details
  if (fmt(challengeUpdatedAt))
    parts.push(`<lastmod>${fmt(challengeUpdatedAt)}</lastmod>`)
  parts.push('</sitemap>')

  // Video 詳細の子sitemap
  parts.push('<sitemap>')
  parts.push(`<loc>${origin}/sitemap.video.xml</loc>`) // child sitemap for video details
  if (fmt(videoUpdatedAt))
    parts.push(`<lastmod>${fmt(videoUpdatedAt)}</lastmod>`)
  parts.push('</sitemap>')

  parts.push('</sitemapindex>')

  // 6) 200応答（ETag/Last-Modified/TTL）
  return new Response(parts.join(''), {
    headers: buildHeaders({
      etag,
      lastModified,
      cacheControl,
    }),
  })
}

export const headers = () => ({
  'Content-Type': 'application/xml; charset=utf-8',
})

// ---- helpers ----
type RevisionTuple = [Date | null, Date | null, number | null, number | null]

async function fetchRevisions(
  db: D1Database,
): Promise<[RevisionTuple, null] | [null, Response]> {
  try {
    const result = (await Promise.all([
      getChallengeArchiveListUpdatedAt(db),
      getVideoArchiveListUpdatedAt(db),
      getChallengeArchiveListRevision(db),
      getVideoArchiveListRevision(db),
    ])) as RevisionTuple
    return [result, null]
  } catch (e) {
    console.error(e)
    return [
      null,
      new Response(null, {
        status: 503,
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      }),
    ]
  }
}

function buildHeaders(args: {
  etag: string
  lastModified: Date | null
  cacheControl: string
}): HeadersInit {
  return {
    'Content-Type': 'application/xml; charset=utf-8',
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
  let sMaxAge = 300 // default 5m
  if (ageSec < TEN_MINUTES)
    sMaxAge = 300 // <10m
  else if (ageSec < ONE_DAY)
    sMaxAge = 3600 // <24h
  else if (ageSec < ONE_WEEK)
    sMaxAge = 86400 // <7d
  else sMaxAge = ONE_WEEK // ≥7d
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
