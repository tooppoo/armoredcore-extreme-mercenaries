import type { LoaderFunctionArgs } from 'react-router'
import type { Database } from '~/db/driver.server'
import { origin } from '~/lib/constants'
import {
  getChallengeArchiveListUpdatedAt,
  getChallengeArchiveListRevision,
} from '~/lib/archives/challenge/revision/repository'
import {
  getVideoArchiveListUpdatedAt,
  getVideoArchiveListRevision,
} from '~/lib/archives/video/revision/repository'
import { records as updateRecords } from '~/lib/updates/repository/record.server'

/**
 * なぜ子sitemapに分割するのか（方針3-1）
 * - スケール: URL上限(5万)/サイズ上限(10MB)に対応しやすく、将来の分割・ページングが容易
 * - パフォーマンス: セクションごとにDB負荷・キャッシュ(TTL/ETag)を最適化可能
 * - 回復性: 一部の生成失敗が全体に波及しない（フェイルソフト）
 * - 追従性: ライブラリに依存しない標準的な構成で保守が容易
 */
export async function loader({ request, context }: LoaderFunctionArgs) {
  // 1) 最新の更新時刻（Last-Modified用）とリビジョン（ETag用）を取得
  const [challengeUpdatedAt, videoUpdatedAt, challengeRev, videoRev] =
    await fetchRevisions(context.db as Database)

  // Updates(更新履歴)の最終更新日時（コード管理のためDB外）
  const updatesUpdatedAt = getLatestUpdateDateFromUpdates()

  // 2) Last-Modified は最大の更新時刻
  const lastMs = [challengeUpdatedAt, videoUpdatedAt, updatesUpdatedAt]
    .filter((d): d is Date => Boolean(d))
    .map((d) => d.getTime())
    .reduce((a, b) => (a > b ? a : b), 0)
  const lastModified = lastMs ? new Date(lastMs) : null

  // 3) グローバルETag: 複数リビジョンを安定化して弱いETag化
  // updatesはDBリビジョンが無いので、最新日時を数値化してETagに含める
  const u = updatesUpdatedAt ? updatesUpdatedAt.getTime() : 0
  const base = JSON.stringify({ c: challengeRev ?? 0, v: videoRev ?? 0, u })
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

  // Updates（更新履歴 詳細）の子sitemap
  parts.push('<sitemap>')
  parts.push(`<loc>${origin}/sitemap.updates.xml</loc>`) // child sitemap for updates details
  if (fmt(updatesUpdatedAt))
    parts.push(`<lastmod>${fmt(updatesUpdatedAt)}</lastmod>`)
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
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      ...buildHeaders({
        etag,
        lastModified,
        cacheControl,
      }),
    },
  })
}

// ---- helpers ----
type RevisionTuple = [Date | null, Date | null, number | null, number | null]

async function fetchRevisions(db: Database): Promise<RevisionTuple> {
  try {
    return (await Promise.all([
      getChallengeArchiveListUpdatedAt(db),
      getVideoArchiveListUpdatedAt(db),
      getChallengeArchiveListRevision(db),
      getVideoArchiveListRevision(db),
    ])) as RevisionTuple
  } catch (e) {
    console.error(e)
    throw new Response(null, {
      status: 503,
      headers: {
        'Cache-Control': 'no-store',
      },
    })
  }
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

// 更新履歴(records)から最終更新日時を取得
function getLatestUpdateDateFromUpdates(): Date | null {
  try {
    const flat = updateRecords.flat()
    return flat.length > 0
      ? flat.reduce(
          (latest, u) => (u.createdAt > latest ? u.createdAt : latest),
          flat[0].createdAt,
        )
      : null
  } catch (e) {
    console.error(e)
    return null
  }
}
