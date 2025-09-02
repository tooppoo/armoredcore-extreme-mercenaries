import type { LoaderFunctionArgs } from 'react-router'
import { origin } from '~/lib/constants'
import { getChallengeArchiveListUpdatedAt } from '~/lib/archives/challenge/revision/repository'
import { getVideoArchiveListUpdatedAt } from '~/lib/archives/video/revision/repository'

/**
 * なぜ子sitemapに分割するのか（方針3-1）
 * - スケール: URL上限(5万)/サイズ上限(10MB)に対応しやすく、将来の分割・ページングが容易
 * - パフォーマンス: セクションごとにDB負荷・キャッシュ(TTL/ETag)を最適化可能
 * - 回復性: 一部の生成失敗が全体に波及しない（フェイルソフト）
 * - 追従性: ライブラリに依存しない標準的な構成で保守が容易
 */
export async function loader({ context }: LoaderFunctionArgs) {
  const [challengeUpdatedAt, videoUpdatedAt] = await Promise.all([
    getChallengeArchiveListUpdatedAt(context.db),
    getVideoArchiveListUpdatedAt(context.db),
  ])

  const fmt = (d: Date | null) => (d ? d.toISOString() : undefined)

  const parts: string[] = []
  parts.push('<?xml version="1.0" encoding="UTF-8"?>')
  parts.push(
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  )

  parts.push('<sitemap>')
  parts.push(`<loc>${origin}/sitemap.challenge.xml</loc>`) // child sitemap for challenge details
  if (fmt(challengeUpdatedAt))
    parts.push(`<lastmod>${fmt(challengeUpdatedAt)}</lastmod>`)
  parts.push('</sitemap>')

  parts.push('<sitemap>')
  parts.push(`<loc>${origin}/sitemap.video.xml</loc>`) // child sitemap for video details
  if (fmt(videoUpdatedAt))
    parts.push(`<lastmod>${fmt(videoUpdatedAt)}</lastmod>`)
  parts.push('</sitemap>')

  parts.push('</sitemapindex>')

  return new Response(parts.join(''), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800',
    },
  })
}

export const headers = () => ({
  'Content-Type': 'application/xml; charset=utf-8',
})
