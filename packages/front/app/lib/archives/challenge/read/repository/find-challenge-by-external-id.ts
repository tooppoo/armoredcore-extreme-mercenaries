import { eq } from 'drizzle-orm'
import { Database } from '~/db/driver.server'
import { challengeArchives } from '~/db/schema.server'
import { ReadArchive } from '~/lib/archives/challenge/read/entity'

export async function findChallengeArchiveByExternalId(externalId: string, db: Database): Promise<ReadArchive | null> {
  return db
    .select()
    .from(challengeArchives)
    .where(eq(challengeArchives.externalId, externalId))
    .get().then((result) => result || null)
}