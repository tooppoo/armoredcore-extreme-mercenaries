import { Database } from '~/db/driver.server'
import { eq } from 'drizzle-orm'
import { challengeArchives } from '~/db/schema.server'
import { normalizeUrl } from '~/lib/archives/common/url/support-url.server'
import { FindArchiveByURL } from '~/lib/archives/common/url/find-archive-by-url'

export const findChallengeArchiveByURL = (db: Database): FindArchiveByURL =>
  async (url: URL) => {
    const [result] = await db
      .select()
      .from(challengeArchives)
      .where(eq(challengeArchives.url, normalizeUrl(url).toString()))

    if (!result) {
      return null
    }
    
    return {
      ...result,
      url: result.url ? new URL(result.url) : null,
    }
  }
