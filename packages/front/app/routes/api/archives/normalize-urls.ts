import { SitemapFunction } from 'remix-sitemap'
import { successWithoutToken } from '~/lib/http/response/json/auth.server'
import {
  forbidden,
  internalServerError,
} from '~/lib/http/response/json/error.server'
import { normalizeUrl } from '~/lib/archives/common/url/support-url.server'
import { videoArchives } from '~/db/schema.server'
import { eq } from 'drizzle-orm'
import { makeCatchesSerializable } from '~/lib/error'
import type { Route } from './+types/normalize-urls'
import { requireAuthToken } from '~/lib/http/request/require-auth-token.server'

export const action = (args: Route.ActionArgs) => {
  requireAuthToken(args)

  switch (args.request.method.toUpperCase()) {
    case 'POST':
      return post(args)
    default:
      throw forbidden(null)
  }
}

const post = async ({ context }: Route.ActionArgs) => {
  try {
    // Fetch all video archives
    const allArchives = await context.db
      .select({
        id: videoArchives.id,
        url: videoArchives.url,
      })
      .from(videoArchives)
      .all()

    let processedCount = 0
    let updatedCount = 0
    const errors: string[] = []

    // Process each archive
    for (const archive of allArchives) {
      try {
        const originalUrl = new URL(archive.url)
        const normalizedUrl = normalizeUrl(originalUrl)
        const normalizedUrlString = normalizedUrl.toString()

        processedCount++

        // Only update if the URL actually changed
        if (archive.url !== normalizedUrlString) {
          await context.db
            .update(videoArchives)
            .set({ url: normalizedUrlString })
            .where(eq(videoArchives.id, archive.id))
          
          updatedCount++
        }
      } catch (error) {
        console.error(`Error processing archive ${archive.id}:`, error)
        errors.push(`Archive ID ${archive.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    const result = {
      totalArchives: allArchives.length,
      processedCount,
      updatedCount,
      errors: errors.length > 0 ? errors : undefined,
    }

    console.log('URL normalization completed:', result)
    return successWithoutToken(result)
  } catch (error) {
    console.error({ error: makeCatchesSerializable(error) })
    throw internalServerError({
      code: 'normalization-failed',
      message: 'Failed to normalize URLs',
      detail: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

export const sitemap: SitemapFunction = () => ({
  exclude: true,
})