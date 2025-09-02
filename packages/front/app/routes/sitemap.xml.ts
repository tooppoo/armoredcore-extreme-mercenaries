import type { LoaderFunctionArgs } from 'react-router'
import { origin } from '~/lib/constants'
import { getChallengeArchiveListUpdatedAt } from '~/lib/archives/challenge/revision/repository'
import { getVideoArchiveListUpdatedAt } from '~/lib/archives/video/revision/repository'

export async function loader({ context }: LoaderFunctionArgs) {
  const [challengeUpdatedAt, videoUpdatedAt] = await Promise.all([
    getChallengeArchiveListUpdatedAt(context.db),
    getVideoArchiveListUpdatedAt(context.db),
  ])

  const fmt = (d: Date | null) => (d ? d.toISOString() : undefined)

  const parts: string[] = []
  parts.push('<?xml version="1.0" encoding="UTF-8"?>')
  parts.push('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')

  parts.push('<sitemap>')
  parts.push(`<loc>${origin}/sitemap.challenge.xml</loc>`) // child sitemap for challenge details
  if (fmt(challengeUpdatedAt)) parts.push(`<lastmod>${fmt(challengeUpdatedAt)}</lastmod>`) 
  parts.push('</sitemap>')

  parts.push('<sitemap>')
  parts.push(`<loc>${origin}/sitemap.video.xml</loc>`) // child sitemap for video details
  if (fmt(videoUpdatedAt)) parts.push(`<lastmod>${fmt(videoUpdatedAt)}</lastmod>`) 
  parts.push('</sitemap>')

  parts.push('</sitemapindex>')

  return new Response(parts.join(''), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800',
    },
  })
}

export const headers = () => ({ 'Content-Type': 'application/xml; charset=utf-8' })

