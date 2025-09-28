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
import { getOgpStrategyProvider } from '~/lib/archives/common/ogp/get-strategy.provider.server'
import { saveVideoArchive } from '~/lib/archives/video/upload/repository/save-video-archive.server'
import { findVideoArchiveByURL } from '~/lib/archives/video/upload/repository/find-video-archive-by-url'
import { postArchiveBody } from '~/lib/archives/video/upload/params.server'
import { makeCatchesSerializable } from '~/lib/error'
import type { Route } from './+types/video'
import { requireAuthToken } from '~/lib/http/request/require-auth-token.server'
import { handleZodError, parseJson } from '~/lib/http/request/parser.server'
import { normalizeUrl } from '~/lib/archives/common/url/support-url.server'
import { overrideArchiveContents } from '~/lib/archives/video/upload/override-archive-contents.server'

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
  const normalizedUrl = normalizeUrl(originalUrl)

  const archiveFromUrl = await buildVideoArchiveFromUrl(normalizedUrl, {
    env: context.cloudflare.env,
    getOGPStrategy: getOgpStrategyProvider(context.cloudflare.env),
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

  // サムネイル画像など、OGPはいずれにせよ必要なので
  // このタイミングでの上書きで良い
  const archive = overrideArchiveContents(archiveFromUrl, data)

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

// API routes are not meant for indexing; excluded from any sitemap.
