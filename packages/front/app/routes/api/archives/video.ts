import { SitemapFunction } from 'remix-sitemap';
import { successWithoutToken } from '~/lib/api/response/json/auth.server';
import { badRequest, forbidden, internalServerError, unknownError } from '~/lib/api/response/json/error.server';
import { ArchiveError, duplicatedUrl, failedGetOGP, unsupportedUrl } from '~/lib/archives/common/errors.server';
import { buildArchiveFromUrl } from '~/lib/archives/video/upload/functions.server';
import { getOGPStrategy } from '~/lib/archives/common/ogp/ogp-strategy.server';
import { saveArchive } from '~/lib/archives/video/upload/repository/save-archive.server';
import { findByURL } from '~/lib/archives/video/upload/repository/find-by-url';
import { postArchiveBody } from '~/lib/archives/video/upload/params.server';
import { makeCatchesSerializable } from '~/lib/error';
import type { Route } from './+types/video'
import { requireAuthToken } from '~/lib/api/request/require-auth-token.server';
import { handleZodError, parseJson } from '~/lib/api/request/parser.server';

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

  const archive = await buildArchiveFromUrl(
    new URL(data.url),
    {
      env: context.cloudflare.env,
      getOGPStrategy,
      findByURL: findByURL(context.db),
    }
  ).catch((error: ArchiveError) => {
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

  await saveArchive(
    {
      contents: archive,
      uploader: {
        id: data.discord_user.id,
        name: data.discord_user.name,
      }
    },
    context.db
  ).catch(unknownError)

  return successWithoutToken(null)
}

export const sitemap: SitemapFunction = () => ({
  exclude: true
})
