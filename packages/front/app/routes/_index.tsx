import type { LoaderFunction, MetaFunction } from "@remix-run/cloudflare";
import { Link, useLoaderData } from '@remix-run/react';
import { siteName } from '~/lib/constants';
import { LoadDiscord, loadDiscord } from '~/lib/discord/loader.server';
import { buildMeta, unofficialServer } from '~/lib/head/build-meta';

export const meta: MetaFunction = ({ location }) => {
  return [
    ...buildMeta({
      title: 'TOP',
      description: `${unofficialServer}の情報公開サイトです`,
      pathname: location.pathname,
    })
  ];
};

export const loader: LoaderFunction = async (args): Promise<LoadDiscord> => ({
  ...loadDiscord(args),
})

export default function Index() {
  const { discord } = useLoaderData<LoadDiscord>()

  return (
    <div className="flex flex-col items-begin justify-begin">
      {lists(discord).map(({ caption, hash, content }) => (
        <section className='mb-3' key={caption}>
          <h2>
            <Link to={{ hash }}>{caption}</Link>
          </h2>
          <div>{content}</div>
        </section>
      ))}
    </div>
  );
}

const lists = (discord: LoadDiscord['discord']) => [
  {
    caption: 'このページについて',
    hash: '#about',
    content: (
      <>
        フロム・ソフトウェア開発のゲーム「アーマードコア」シリーズの非公式discordサーバー<br />
        「{siteName}」に関する情報を公開するサイトです。
      </>
    ),
  },
  {
    caption: '利用規約',
    hash: '#rule',
    content: (
      <>
        サーバーの利用規約は<Link to="/rule">こちら</Link>から確認できます。<br/>
        サーバーの利用者は必ず目を通してください。
      </>
    )
  },
  {
    caption: '罰則規定',
    hash: '#penalties',
    content: (
      <>
        サーバーの利用規約に違反した場合、管理者・運営から罰則を与える場合があります。<br/>
        詳細は<Link to="/penalties">こちら</Link>からご確認ください。<br/>
        サーバーの利用者は必ず目を通してください。
      </>
    )
  },
  {
    caption: 'Discordサーバー',
    hash: '#server',
    content: (
      <>
        以下の招待リンクからアクセスできます。<br/>
        <div className="my-3">
          <Link to={discord.invite}>
            サーバーへ参加
          </Link><br/>
        </div>
        利用規約・罰則規定を確認・同意いただいた上でご参加ください。
      </>
    )
  },
  {
    caption: '更新履歴',
    hash: '#updates',
    content: (
      <>
        本文書の更新履歴は<Link to="/updates">こちら</Link>からご確認いただけます。
      </>
    )
  },
  {
    caption: 'ライセンス',
    hash: '#license',
    content: (
      <>
        本文書は
        <Link to="https://creativecommons.org/licenses/by-nd/4.0" target="_blank" rel="noreferrer">
        CC BY-ND 4.0
        </Link>
        によってライセンスされています。

        <p className="flex mt-1">
          <a className="flex" href="https://creativecommons.org/licenses/by-nd/4.0/?ref=chooser-v1" target="_blank" rel="license noopener noreferrer">
            <img style={{ height: 22, marginLeft: 3, verticalAlign: 'text-bottom' }} src="https://mirrors.creativecommons.org/presskit/icons/cc.svg?ref=chooser-v1" alt="" />
            <img style={{ height: 22, marginLeft: 3, verticalAlign: 'text-bottom' }} src="https://mirrors.creativecommons.org/presskit/icons/by.svg?ref=chooser-v1" alt="" />
            <img style={{ height: 22, marginLeft: 3, verticalAlign: 'text-bottom' }} src="https://mirrors.creativecommons.org/presskit/icons/nd.svg?ref=chooser-v1" alt="" />
          </a>
        </p> 
      </>
    )
  }
];
