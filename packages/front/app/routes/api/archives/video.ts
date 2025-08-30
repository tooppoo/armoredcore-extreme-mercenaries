import { SitemapFunction } from 'remix-sitemap'
import { successWithoutToken } from '~/lib/http/response/json/auth.server'
import {
  badRequest,
  forbidden,
  internalServerError,
  unknownError,
} from '~/lib/http/response/json/error.server'
import {
  ArchiveError,
  duplicatedUrl,
  failedGetOGP,
  unsupportedUrl,
} from '~/lib/archives/common/errors.server'
import { buildVideoArchiveFromUrl } from '~/lib/archives/video/upload/functions.server'
import { getOGPStrategy } from '~/lib/archives/common/ogp/ogp-strategy.server'
import { saveVideoArchive } from '~/lib/archives/video/upload/repository/save-video-archive.server'
import { findVideoArchiveByURL } from '~/lib/archives/video/upload/repository/find-video-archive-by-url'
import { postArchiveBody } from '~/lib/archives/video/upload/params.server'
import { makeCatchesSerializable } from '~/lib/error'
import type { Route } from './+types/video'
import { requireAuthToken } from '~/lib/http/request/require-auth-token.server'
import { handleZodError, parseJson } from '~/lib/http/request/parser.server'
import { normalizeYouTubeUrlForStorage } from '~/lib/archives/common/url/support-url.server'

export const action = (args: Route.ActionArgs) => {
  requireAuthToken(args)

  switch (args.request.method.toUpperCase()) {
    case 'POST':
      return post(args)
    default:
      throw forbidden(null)
  }
}

const post = async ({ request, context }: Route.ActionArgs) => {
  const json = await parseJson(request)
  const data = await postArchiveBody.parseAsync(json).catch(handleZodError)

  // Normalize the URL before processing to ensure consistent storage format
  const originalUrl = new URL(data.url)
  const normalizedUrl = normalizeYouTubeUrlForStorage(originalUrl)

  const archive = await buildVideoArchiveFromUrl(normalizedUrl, {
    env: context.cloudflare.env,
    getOGPStrategy,
    findArchiveByURL: findVideoArchiveByURL(context.db),
  }).catch((error: ArchiveError) => {
    console.error({ error: makeCatchesSerializable(error) })

    switch (error.code) {
      case unsupportedUrl:
      case duplicatedUrl:
        throw badRequest(error)
      case failedGetOGP:
        throw internalServerError(error)
      default:
        throw unknownError(error)
    }
  })

  await saveVideoArchive(
    {
      contents: archive,
      uploader: {
        id: data.discord_user.id,
        name: data.discord_user.name,
      },
    },
    context.db,
  ).catch(unknownError)

  return successWithoutToken(null)
}

export const sitemap: SitemapFunction = () => ({
  exclude: true,
})
