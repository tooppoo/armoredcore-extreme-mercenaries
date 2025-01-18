import { ActionFunction } from 'react-router';
import { SitemapFunction } from 'remix-sitemap';
import { invalidToken, successWithoutToken, tokenRequired } from '~/lib/api/response/json/auth.server';
import { badRequest, forbidden, internalServerError, unknownError } from '~/lib/api/response/json/error';
import { ArchiveError, duplicatedUrl, failedGetOGP, unsupportedUrl } from '~/lib/archives/upload/errors.server';
import { buildArchiveFromUrl } from '~/lib/archives/upload/functions.server';
import { getOGPStrategy } from '~/lib/archives/upload/ogp/ogp-strategy.server';
import { saveArchive } from '~/lib/archives/upload/repository/save-archive.server';
import { findByURL } from '~/lib/archives/upload/repository/find-by-url';
import { makeCatchesSerializable } from '~/lib/error';

export const action: ActionFunction = (args) => {
  const auth = args.request.headers.get('Authorization')
  const token = auth?.replace('Bearer ', '')

  if (!token) {
    throw tokenRequired({ cause: 'token is required' })
  }
  if (token !== args.context.cloudflare.env.AUTH_UPLOAD_ARCHIVE) {
    throw invalidToken({ cause: 'invalid token' })
  }

  switch (args.request.method.toUpperCase()) {
    case 'POST':
      return post(args)
    default:
      throw forbidden(null)
  }
}

type PostArchivesBody = Readonly<{
  url: string
  discord_user: {
    id: string
    name: string
  }
}>
const post: ActionFunction = async ({ request, context }) => {
  const data = await request.json<PostArchivesBody>()

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
