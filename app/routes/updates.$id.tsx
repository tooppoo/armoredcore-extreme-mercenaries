import { LoaderFunction } from '@remix-run/cloudflare';
import { Link, useLoaderData } from '@remix-run/react';
import { Margin } from '~/lib/components/utils/spacer';
import { toTitle } from '~/lib/updates/functions';
import { Update, updates } from '~/lib/updates/record.server';

type AnUpdateLoader = Readonly<{
  record: Update
}>
export const loader: LoaderFunction = async ({ params }): Promise<AnUpdateLoader> => {
  const record = updates.find(r => r.external_id === params.id)
  
  if (!record) {
    throw new Response(null, {
      status: 404,
    })
  }

  return { record }
}

const anUpdate: React.FC = () => {
  const { record } = useLoaderData<AnUpdateLoader>()

  return (
    <div>
      <section>
        <h2>{toTitle(record)}</h2>

        {record.content}
      </section>
      <Margin h={16} />
      <div>
        <Link to="/updates">更新履歴一覧に戻る</Link>
      </div>
    </div>
  )
}
export default anUpdate
