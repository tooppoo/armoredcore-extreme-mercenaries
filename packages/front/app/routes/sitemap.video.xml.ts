import type { LoaderFunctionArgs } from 'react-router'
import { desc } from 'drizzle-orm'
import { origin } from '~/lib/constants'
import { videoArchives } from '~/db/schema.server'

/**
 * 動画アーカイブの子sitemap
 * - 動画アーカイブは個別ページが存在しないため、/archives/video のみを出力
 * - lastmodは最新の動画作成日時
 */
export async function loader({ context }: LoaderFunctionArgs) {
  // Get the latest video creation date for lastmod
  const latestVideo = await context.db
    .select({
      createdAt: videoArchives.createdAt,
    })
    .from(videoArchives)
    .orderBy(desc(videoArchives.createdAt))
    .limit(1)
    .get()

  const parts: string[] = []
  parts.push('<?xml version="1.0" encoding="UTF-8"?>')
  parts.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')

  const loc = `${origin}/archives/video`
  const lastmod = latestVideo
    ? new Date(latestVideo.createdAt).toISOString()
    : new Date().toISOString()
  
  parts.push('<url>')
  parts.push(`<loc>${loc}</loc>`)
  parts.push(`<lastmod>${lastmod}</lastmod>`)
  parts.push('</url>')

  parts.push('</urlset>')

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
