import { LoaderFunction, MetaFunction } from 'react-router';
import { Link, useLoaderData } from 'react-router';
import { buildMeta, unofficialServer } from '~/lib/head/build-meta';
import { ReadUpdate } from '~/lib/updates/entity.server';
import { pageUpdates } from '~/lib/updates/repository/read.server';

type UpdatesLoader = Readonly<{
  updates: readonly ReadUpdate[]
}>
export const loader: LoaderFunction = async (): Promise<UpdatesLoader> => {
  return {
    updates: await pageUpdates({ page: 1 }),
  }
}
export const meta: MetaFunction = ({ location }) => [
  ...buildMeta({
    title: '更新履歴',
    description: `${unofficialServer}の更新履歴です`,
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
            <Link to={`/updates/${r.externalId}`}>
              {r.caption}
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}

export default Updates
