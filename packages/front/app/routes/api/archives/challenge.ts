import { badRequest, forbidden, internalServerError, unknownError } from '~/lib/api/response/json/error.server'
import type { Route } from './+types/challenge'
import { requireAuthToken } from '~/lib/api/request/require-auth-token.server'
import { SitemapFunction } from 'remix-sitemap'
import { handleZodError, parseJson } from '~/lib/api/request/parser.server'
import { postChallengeArchiveBody } from '~/lib/archives/challenge/upload/params.server'
import { buildChallengeArchiveFromText, buildChallengeArchiveFromUrl } from '~/lib/archives/challenge/upload/functions.server'
import { findChallengeArchiveByURL } from '~/lib/archives/challenge/upload/repository/find-challenge-archive-by-url'
import { makeCatchesSerializable } from '~/lib/error'
import { saveChallengeArchive } from '~/lib/archives/challenge/upload/repository/save-challenge-archive.server'
import { getOGPStrategy } from '~/lib/archives/common/ogp/ogp-strategy.server'
import { ArchiveError, duplicatedUrl, failedGetOGP, unsupportedUrl } from '~/lib/archives/common/errors.server'
import { successWithoutToken } from '~/lib/api/response/json/auth.server'

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
  const data = await postChallengeArchiveBody.parseAsync(json).catch(handleZodError)

  const archive = await (async () => {
    switch (data.type) {
      case 'link': {
        return buildChallengeArchiveFromUrl(
          data,
          {
            env: context.cloudflare.env,
            getOGPStrategy,
            findArchiveByURL: findChallengeArchiveByURL(context.db),
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
      }
      case 'text': {
        return buildChallengeArchiveFromText(data)
      }
    }
  })()

  await saveChallengeArchive(
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
