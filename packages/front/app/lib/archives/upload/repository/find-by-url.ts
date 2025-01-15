import { Database } from '~/db/driver.server'
import { SearchSameURLArchive } from '../functions.server'
import { eq } from 'drizzle-orm'
import { archives } from '~/db/schema.server'
import { normalizeUrl } from '~/lib/archives/upload/url/support-url.server'

export const findByURL = (db: Database): SearchSameURLArchive =>
  async (url: URL) => {
    const [result] = await db
      .select()
      .from(archives)
      .where(eq(archives.url, normalizeUrl(url).toString()))

    if (!result) {
      return null
    }
    
    return {
      ...result,
      imageUrl: new URL(result.imageUrl),
      url: new URL(result.url),
    }
  }
