import { LoaderFunction, MetaFunction } from '@remix-run/cloudflare';
import { Link, useLoaderData } from '@remix-run/react';
import { buildMeta, unofficialServer } from '~/lib/head/build-meta';
import { toTitle } from '~/lib/updates/functions';
import { updates as updateRecords, type Update } from '~/lib/updates/record.server';

type UpdatesLoader = Readonly<{
  records: readonly Update[]
}>
export const loader: LoaderFunction = async (): Promise<UpdatesLoader> => {
  return {
    records: updateRecords,
  }
}
export const meta: MetaFunction = ({ location }) => [
  ...buildMeta({
    title: '更新履歴',
    description: `${unofficialServer}の更新履歴です`,
    pathname: location.pathname,
  }),
]

const updates: React.FC = () => {
  const { records } = useLoaderData<UpdatesLoader>()
  return (
    <>
      <h2>更新履歴</h2>
      <ul>
        {records.map((r) => (
          <li key={r.external_id}>
            <Link to={`/updates/${r.external_id}`}>
              {toTitle(r)}
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}

export default updates
