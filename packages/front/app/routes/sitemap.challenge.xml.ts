import type { LoaderFunctionArgs } from 'react-router'
import { origin } from '~/lib/constants'
import { videoArchives, challengeArchives } from '~/db/schema.server'

export async function loader({ context }: LoaderFunctionArgs) {
  // list all challenge archive detail pages
  const rows = await context.db
    .select({ id: challengeArchives.externalId, createdAt: challengeArchives.createdAt })
    .from(challengeArchives)
    .all()

  const parts: string[] = []
  parts.push('<?xml version="1.0" encoding="UTF-8"?>')
  parts.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')

  for (const row of rows) {
    const loc = `${origin}/archives/challenge/${row.id}`
    const lastmod = new Date(row.createdAt).toISOString()
    parts.push('<url>')
    parts.push(`<loc>${loc}</loc>`) 
    parts.push(`<lastmod>${lastmod}</lastmod>`) 
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

