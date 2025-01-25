import { ActionFunction } from 'react-router';
import { SitemapFunction } from 'remix-sitemap';
import { ZodError } from 'zod';
import { invalidToken, successWithoutToken, tokenRequired } from '~/lib/api/response/json/auth.server';
import { badRequest, forbidden, internalServerError, unknownError } from '~/lib/api/response/json/error.server';
import { ArchiveError, duplicatedUrl, failedGetOGP, unsupportedUrl } from '~/lib/archives/video/upload/errors.server';
import { buildArchiveFromUrl } from '~/lib/archives/video/upload/functions.server';
import { getOGPStrategy } from '~/lib/archives/video/upload/ogp/ogp-strategy.server';
import { saveArchive } from '~/lib/archives/video/upload/repository/save-archive.server';
import { findByURL } from '~/lib/archives/video/upload/repository/find-by-url';
import { postArchiveBody } from '~/lib/archives/video/upload/params.server';
import { makeCatchesSerializable } from '~/lib/error';
import type { Route } from './+types/video'

export const action = (args: Route.ActionArgs) => {
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

const post: ActionFunction = async ({ request, context }) => {
  const json = await request.json().catch((e) => {
    const error = makeCatchesSerializable(e)
    console.error({ message: 'request is invalid format', error })

    throw badRequest({ error })
  })
  const data = await postArchiveBody.parseAsync(json).catch((error: ZodError) => {
    console.error({
      message: 'request data is invalid',
      error: error.errors,
    })

    throw badRequest({
      error: error.errors,
    })
  })

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
