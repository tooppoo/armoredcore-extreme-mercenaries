import { data, Link, useLoaderData } from 'react-router'
import { Margin } from '~/lib/utils/components/spacer'
import { buildMeta } from '~/lib/head/build-meta'
import { findUpdate } from '~/lib/updates/repository/read.server'
import { ReadUpdate } from '~/lib/updates/entity.server'
import type { Route } from './+types/detail'

type AnUpdateLoader = Readonly<{
  update: ReadUpdate
}>
export const loader = async ({ params, context }: Route.LoaderArgs) => {
  const update = await findUpdate({ externalId: params.id })

  if (!update) {
    throw new Response(null, {
      status: 404,
    })
  }

  return data(
    { update },
    {
      headers: {
        'Cache-Control': `public, max-age=${context.cloudflare.env.BASE_LONG_CACHE_TIME}`,
        ETag: update.createdAt.toISOString(),
      },
    },
  )
}
export function headers({ loaderHeaders }: Route.HeadersArgs) {
  return loaderHeaders
}

export const meta: Route.MetaFunction = ({ data, location }) => {
  return [
    ...buildMeta({
      title: data.update.title,
      description: data.update.caption,
      pathname: location.pathname,
    }),
  ]
}

const AnUpdate: React.FC = () => {
  const { update } = useLoaderData<AnUpdateLoader>()

  return (
    <div>
      <section>
        <h2>{update.caption}</h2>

        {update.content}
      </section>
      <Margin h={16} />
      <div>
        <Link to="/updates">更新履歴一覧に戻る</Link>
      </div>
    </div>
  )
}

export default AnUpdate
