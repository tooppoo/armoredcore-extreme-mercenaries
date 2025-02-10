import { Link } from 'react-router';
import type { Route } from './+types/index';
import { buildMeta, unofficialServer } from '~/lib/head/build-meta';

const Archives: React.FC = () => {
  return (
    <>
      <h2>アーカイブ</h2>
      <ul>
        <li>
          <Link to="/archives/video">攻略動画アーカイブ</Link>
          <ul>
            <li>様々な縛り・条件による攻略動画へのリンクを掲載しています</li>
          </ul>
        </li>
        <li>
          <Link to="/archives/challenge">チャレンジアーカイブ</Link>
          <ul>
            <li>さまざまな縛り・条件のチャレンジ情報を閲覧できます</li>
          </ul>
        </li>
      </ul>
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
