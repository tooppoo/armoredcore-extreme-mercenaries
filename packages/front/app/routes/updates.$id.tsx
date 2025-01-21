import { Link, useLoaderData } from 'react-router';
import { Margin } from '~/lib/utils/components/spacer';
import { buildMeta, unofficialServer } from '~/lib/head/build-meta';
import { findUpdate } from '~/lib/updates/repository/read.server';
import { ReadUpdate } from '~/lib/updates/entity.server';
import type { Route } from './+types/updates.$id';

type AnUpdateLoader = Readonly<{
  update: ReadUpdate
}>
export const loader = async ({ params }: Route.LoaderArgs): Promise<AnUpdateLoader> => {
  const update = await findUpdate({ externalId: params.id })
  
  if (!update) {
    throw new Response(null, {
      status: 404,
    })
  }

  return { update }
}

export const meta: Route.MetaFunction = ({ data, location }) => {
  return [
    ...buildMeta({
      title: data.update.title,
      description: `${unofficialServer} の更新履歴 ${data.update.caption}`,
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
