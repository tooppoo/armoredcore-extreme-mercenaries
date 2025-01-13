import { MetaFunction } from '@remix-run/cloudflare';
import { Link } from '@remix-run/react';
import { buildMeta, unofficialServer } from 'packages/front/app/lib/head/build-meta';

export const meta: MetaFunction = ({ location }) => {
  return [
    ...buildMeta({
      title: '罰則規定',
      description: `${unofficialServer}の罰則規定ページです`,
      pathname: location.pathname,
    })
  ];
};
export const Penalties: React.FC = () => {
  return (
    <>
      <section>
        <h2>罰則規定</h2>
        <p>
          <Link to="/rule">利用規約</Link>に違反した場合、管理者・運営から該当ユーザーに対して以下の処分を加えることがあります。
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

export default Penalties;
