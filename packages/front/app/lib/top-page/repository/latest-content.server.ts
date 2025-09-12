/**
 * Repository functions to fetch latest content for the top page
 */

import { Database } from '~/db/driver.server'
import { videoArchives, challengeArchives } from '~/db/schema.server'
import { desc, asc } from 'drizzle-orm'
import { pageUpdates } from '~/lib/updates/repository/read.server'
import type { ReadArchive as VideoReadArchive } from '~/lib/archives/video/list/entity'
import type { ReadArchive as ChallengeReadArchive } from '~/lib/archives/challenge/read/entity'
import type { ReadUpdate } from '~/lib/updates/entity.server'

/**
 * Fetch the latest 3 video archives
 */
export async function getLatestVideoArchives(
  db: Database,
): Promise<readonly VideoReadArchive[]> {
  return db
    .select()
    .from(videoArchives)
    .orderBy(desc(videoArchives.createdAt), asc(videoArchives.id))
    .limit(3)
}

/**
 * Fetch the latest 3 challenge archives
 */
export async function getLatestChallengeArchives(
  db: Database,
): Promise<readonly ChallengeReadArchive[]> {
  return db
    .select()
    .from(challengeArchives)
    .orderBy(desc(challengeArchives.createdAt), asc(challengeArchives.id))
    .limit(3)
}

/**
 * Fetch the latest 3 updates
 */
export async function getLatestUpdates(): Promise<readonly ReadUpdate[]> {
  const allUpdates = await pageUpdates({ page: 1 })
  return allUpdates.slice(0, 3)
}

export type LatestContent = Readonly<{
  videos: readonly VideoReadArchive[]
  challenges: readonly ChallengeReadArchive[]
  updates: readonly ReadUpdate[]
}>

/**
 * Fetch all latest content for the top page
 */
export async function getLatestContent(db: Database): Promise<LatestContent> {
  const [videos, challenges, updates] = await Promise.all([
    getLatestVideoArchives(db),
    getLatestChallengeArchives(db),
    getLatestUpdates(),
  ])

  return {
    videos,
    challenges,
    updates,
  }
}