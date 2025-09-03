export type LastmodResolver = (ctx: {
  db: Database
}) => Promise<Date | null>

import type { Database } from '~/db/driver.server'
import { getChallengeArchiveListUpdatedAt } from '~/lib/archives/challenge/revision/repository'
import { getVideoArchiveListUpdatedAt } from '~/lib/archives/video/revision/repository'

export type CorePage = Readonly<{
  path: string
  lastmod?: 'challenge' | 'video' | 'both'
}>

/**
 * コア（静的/一覧）ページの定義を一元管理
 * - sitemap.core.xml の生成や、将来のナビ生成にも再利用可能
 */
export const corePages: readonly CorePage[] = [
  { path: '/', lastmod: 'both' },
  { path: '/rule' },
  { path: '/penalties' },
  { path: '/updates' },
  { path: '/archives', lastmod: 'both' },
  { path: '/archives/challenge', lastmod: 'challenge' },
  { path: '/archives/video', lastmod: 'video' },
]

export async function resolveLastmod(
  key: CorePage['lastmod'] | undefined,
  ctx: { db: Database },
): Promise<Date | null> {
  if (!key) return null
  if (key === 'challenge') return getChallengeArchiveListUpdatedAt(ctx.db)
  if (key === 'video') return getVideoArchiveListUpdatedAt(ctx.db)
  // both: 最大の更新時刻を採用
  const [c, v] = await Promise.all([
    getChallengeArchiveListUpdatedAt(ctx.db),
    getVideoArchiveListUpdatedAt(ctx.db),
  ])
  if (!c && !v) return null
  if (c && !v) return c
  if (!c && v) return v
  return (c!.getTime() > v!.getTime() ? c : v)!
}

