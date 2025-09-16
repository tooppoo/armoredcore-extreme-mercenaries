import type { LoaderFunctionArgs } from 'react-router'
import { origin } from '~/lib/constants'
import { records as updateRecords } from '~/lib/updates/repository/record.server'

/**
 * 更新履歴（Updates）詳細ページ用 子sitemap
 * - 各更新エントリの詳細ページを列挙
 * - lastmod はエントリの作成日時
 */
export async function loader(_: LoaderFunctionArgs) {
  // flatten all updates
  const updates = updateRecords.flat()

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
      'Cache-Control': 'public, max-age=1800',
    },
  })
}

export const headers = () => ({
  'Content-Type': 'application/xml; charset=utf-8',
})

