import { Link } from 'react-router'
import { buildMeta, unofficialServer } from '~/lib/head/build-meta'
import type { Route } from './+types/penalties'
import { TZDate } from '@date-fns/tz';

export const loader = async ({ context }: Route.LoaderArgs) => Response.json(
  {},
  {
    headers: {
      'Cache-Control': `public, max-age=${context.cloudflare.env.BASE_LONG_CACHE_TIME}`,
      'ETag': new TZDate(2025, 1, 15).toISOString(),
    },
  }
)
export function headers({ loaderHeaders }: Route.HeadersArgs) {
  return loaderHeaders;
}

export const meta: Route.MetaFunction = ({ location }) => {
  return [
    ...buildMeta({
      title: '罰則規定',
      description: `${unofficialServer}の罰則規定ページです`,
      pathname: location.pathname,
    }),
  ]
}
export const Penalties: React.FC = () => {
  return (
    <>
      <section>
        <h2>罰則規定</h2>
        <p>
          <Link to="/rule">利用規約</Link>
          に違反した場合、管理者・運営から該当ユーザーに対して以下の処分を加えることがあります。
        </p>
        <ul className="list-disc pl-6 mt-4">
          <li>投稿・スレッドの削除</li>
          <li>タイムアウト</li>
          <li>キック</li>
          <li>BAN</li>
        </ul>
        <p className="mt-4">
          詳細は<Link to="/rule">利用規約</Link>を参照してください
        </p>
      </section>
    </>
  )
}

export default Penalties
