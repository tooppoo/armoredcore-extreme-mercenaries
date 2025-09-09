import type { LoaderFunctionArgs } from 'react-router'
import { origin } from '~/lib/constants'
import { corePages } from '~/lib/site/core-pages'
import { resolveLastmod } from '~/lib/site/core-pages.server'

/**
 * コア（静的/一覧）ページ用の子sitemap
 * - TOP/固定ページ/一覧ページを収録
 * - lastmodは取得可能なもののみ付与（一覧はcontents_revisionsのupdatedAtに連動）
 */
export async function loader({ context }: LoaderFunctionArgs) {
  const entries = await Promise.all(
    corePages.map(async (p) => ({
      loc: `${origin}${p.path}`,
      lastmod: await resolveLastmod(p.lastmod, { db: context.db }),
    })),
  )

  const parts: string[] = []
  parts.push('<?xml version="1.0" encoding="UTF-8"?>')
  parts.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')

  for (const u of entries) {
    parts.push('<url>')
    parts.push(`<loc>${u.loc}</loc>`)
    if (u.lastmod) parts.push(`<lastmod>${u.lastmod.toISOString()}</lastmod>`)
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
