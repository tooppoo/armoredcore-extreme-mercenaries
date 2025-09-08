import type { Database } from '~/db/driver.server'
import { getChallengeArchiveListUpdatedAt } from '~/lib/archives/challenge/revision/repository'
import { getVideoArchiveListUpdatedAt } from '~/lib/archives/video/revision/repository'
import type { CorePage } from './core-pages'

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
