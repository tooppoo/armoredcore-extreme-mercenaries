import type { Database } from '~/db/driver.server'
import { videoArchives, challengeArchives } from '~/db/schema.server'
import { desc, asc } from 'drizzle-orm'

// 最新の動画アーカイブを取得
export async function getLatestVideoArchives(
  db: Database,
  limit: number = 3,
) {
  return db
    .select()
    .from(videoArchives)
    .orderBy(desc(videoArchives.createdAt), asc(videoArchives.id))
    .limit(limit)
}

// 最新のチャレンジアーカイブを取得
export async function getLatestChallengeArchives(
  db: Database,
  limit: number = 3,
) {
  return db
    .select()
    .from(challengeArchives)
    .orderBy(desc(challengeArchives.createdAt), asc(challengeArchives.id))
    .limit(limit)
}