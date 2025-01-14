import { ActionFunction } from '@remix-run/cloudflare';
import { SitemapFunction } from 'remix-sitemap';
import { buildArchiveFromUrl } from '~/lib/archives/upload/functions.server';
import { saveArchive } from '~/lib/archives/upload/repository/save-archive';

export const action: ActionFunction = (args) => {
  switch (args.request.method) {
    case 'POST':
      return post(args)
    default:
      throw Response.json(null, {
        status: 403,
        statusText: 'Forbidden',
      })
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
  const auth = request.headers.get('Authorization')
  const token = auth?.replace('Bearer ', '')

  if (!token) {
    throw Response.json(null, {
      status: 400,
      statusText: 'BadRequest',
      headers: {
        'WWW-Authenticate': 'Bearer error="token_required"'
      }
    })
  }
  if (token !== context.cloudflare.env.AUTH_UPLOAD_ARCHIVE) {
    throw Response.json(null, {
      status: 400,
      statusText: 'BadRequest',
      headers: {
        'WWW-Authenticate': 'Bearer error="invalid_token"'
      }
    })
  }

  const data = await request.json<PostArchivesBody>()
  const archive = await buildArchiveFromUrl(new URL(data.url))

  await saveArchive(
    {
      contents: archive,
      uploader: {
        id: data.discord_user.id,
        name: data.discord_user.name,
      }
    },
    context.db
  )

  return Response.json(null, {
    status: 200,
    headers: {
      'WWW-Authenticate': 'Bearer realm=""'
    }
  })
}

export const sitemap: SitemapFunction = () => ({
  exclude: true
})
