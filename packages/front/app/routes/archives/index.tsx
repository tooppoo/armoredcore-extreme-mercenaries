import { Link } from 'react-router';
import type { Route } from './+types/index';
import { buildMeta, unofficialServer } from '~/lib/head/build-meta';

const Archives: React.FC = () => {
  return (
    <>
      <h2 className='mb-4'>アーカイブ目次</h2>
      <section className='ml-4'>
        <h3>
          <Link to="/archives/video">攻略動画アーカイブ</Link>
        </h3>
        様々な縛り・条件による攻略動画へのリンクを掲載しています
      </section>

      <div className='my-4' />

      <section className='ml-4'>
        <h3>
          <Link to="/archives/challenge">チャレンジアーカイブ</Link>
        </h3>
        さまざまな縛り・条件のチャレンジ情報を掲載しています
      </section>
    </>
  )
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
];
