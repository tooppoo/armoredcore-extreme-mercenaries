import type { LoaderFunctionArgs } from 'react-router'
import { origin } from '~/lib/constants'
import { getChallengeArchiveListUpdatedAt } from '~/lib/archives/challenge/revision/repository'
import { getVideoArchiveListUpdatedAt } from '~/lib/archives/video/revision/repository'

/**
 * コア（静的/一覧）ページ用の子sitemap
 * - TOP/固定ページ/一覧ページを収録
 * - lastmodは取得可能なもののみ付与（一覧はcontents_revisionsのupdatedAtに連動）
 */
export async function loader({ context }: LoaderFunctionArgs) {
  const [challengeUpdatedAt, videoUpdatedAt] = await Promise.all([
    getChallengeArchiveListUpdatedAt(context.db),
    getVideoArchiveListUpdatedAt(context.db),
  ])

  const fmt = (d: Date | null) => (d ? d.toISOString() : undefined)
  const max = (...ds: (Date | null | undefined)[]) =>
    ds.filter(Boolean).map((d) => (d as Date).getTime()).reduce((a, b) => (a > b ? a : b), 0) || undefined

  const nowFor = (...ds: (Date | null | undefined)[]) => {
    const ms = max(...ds)
    return ms ? new Date(ms).toISOString() : undefined
  }

  const urls: { loc: string; lastmod?: string }[] = [
    { loc: `${origin}/`, lastmod: nowFor(challengeUpdatedAt, videoUpdatedAt) },
    { loc: `${origin}/rule` },
    { loc: `${origin}/penalties` },
    { loc: `${origin}/updates` },
    { loc: `${origin}/archives`, lastmod: nowFor(challengeUpdatedAt, videoUpdatedAt) },
    { loc: `${origin}/archives/challenge`, lastmod: fmt(challengeUpdatedAt) },
    { loc: `${origin}/archives/video`, lastmod: fmt(videoUpdatedAt) },
  ]

  const parts: string[] = []
  parts.push('<?xml version="1.0" encoding="UTF-8"?>')
  parts.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')

  for (const u of urls) {
    parts.push('<url>')
    parts.push(`<loc>${u.loc}</loc>`) 
    if (u.lastmod) parts.push(`<lastmod>${u.lastmod}</lastmod>`) 
    parts.push('</url>')
  }

  parts.push('</urlset>')

  return new Response(parts.join(''), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800',
    },
  })
}

export const headers = () => ({ 'Content-Type': 'application/xml; charset=utf-8' })

