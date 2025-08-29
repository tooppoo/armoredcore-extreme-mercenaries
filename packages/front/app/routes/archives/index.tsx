import { Link, Outlet, useLocation } from 'react-router'
import type { Route } from './+types/index'
import { buildMeta, unofficialServer } from '~/lib/head/build-meta'
import { TZDate } from '@date-fns/tz'

export const loader = async ({ context }: Route.LoaderArgs) =>
  Response.json(
    {},
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

const Archives: React.FC = () => {
  const location = useLocation()
  const isIndexRoute = location.pathname === '/archives'

  if (isIndexRoute) {
    return (
      <>
        <h2 className="mb-4">アーカイブ目次</h2>
        <section className="ml-4">
          <h3>
            <Link to="/archives/video">攻略動画アーカイブ</Link>
          </h3>
          様々な縛り・条件による攻略動画へのリンクを掲載しています
        </section>

        <div className="my-4" />

        <section className="ml-4">
          <h3>
            <Link to="/archives/challenge">チャレンジアーカイブ</Link>
          </h3>
          さまざまな縛り・条件のチャレンジ情報を掲載しています
        </section>
      </>
    )
  }

  return <Outlet />
}

export const handle = {
  breadcrumb: 'アーカイブ'
}

export default Archives

export const meta: Route.MetaFunction = ({ location }) => [
  ...buildMeta({
    title: 'アーカイブ目次',
    description: [
      `${unofficialServer}の各アーカイブページへのリンクを掲載しています。`,
    ].join(''),
    pathname: location.pathname,
  }),
]
