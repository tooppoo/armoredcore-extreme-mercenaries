import { data, Link, useLoaderData } from 'react-router'
import { buildMeta, unofficialServer } from '~/lib/head/build-meta'
import { ReadUpdate } from '~/lib/updates/entity.server'
import { pageUpdates } from '~/lib/updates/repository/read.server'
import type { Route } from './+types/list'
import { TZDate } from '@date-fns/tz'

type UpdatesLoader = Readonly<{
  updates: readonly ReadUpdate[]
}>
export const loader = async ({ context }: Route.LoaderArgs) =>
  data(
    {
      updates: await pageUpdates({ page: 1 }),
    },
    {
      headers: {
        'Cache-Control': `public, max-age=${context.cloudflare.env.BASE_LONG_CACHE_TIME}`,
        ETag: new TZDate(2025, 1, 15).toISOString(),
      },
    },
  )
export function headers({ loaderHeaders }: Route.HeadersArgs) {
  return loaderHeaders
}

export const meta: Route.MetaFunction = ({ location }) => [
  ...buildMeta({
    title: '更新履歴一覧',
    description: `${unofficialServer}の更新履歴です。当サイトの更新情報へのリンクを記載しています`,
    pathname: location.pathname,
  }),
]

const Updates: React.FC = () => {
  const { updates: records } = useLoaderData<UpdatesLoader>()
  return (
    <>
      <h2>更新履歴</h2>
      <ul>
        {records.map((r) => (
          <li key={r.externalId}>
            <Link to={`/updates/${r.externalId}`}>{r.caption}</Link>
          </li>
        ))}
      </ul>
    </>
  )
}

export default Updates
