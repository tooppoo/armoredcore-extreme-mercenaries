import type { MetaFunction } from "@remix-run/cloudflare";
import { buildMeta } from '~/lib/head/build-meta';

export const meta: MetaFunction = ({ location }) => {
  return [
    ...buildMeta({
      title: 'TOP',
      description: 'フロム・ソフトウェア開発のゲーム 「アーマードコア」シリーズの非公式discordサーバー 「ARMOREDCORE EXTREME MERCENARIES」の情報公開サイトです',
      pathname: location.pathname,
    })
  ];
};

export default function Index() {
  return (
    <div className="flex h-screen items-center justify-center">

    </div>
  );
}
