import type { Route } from './+types/index'
import { Link, useLoaderData } from 'react-router'
import { LinkIcon } from '@heroicons/react/16/solid'
import { siteName } from '~/lib/constants'
import { LoadDiscord, loadDiscord } from '~/lib/discord/loader.server'
import { buildMeta, unofficialServer } from '~/lib/head/build-meta'
import { TZDate } from '@date-fns/tz'

type IndexLoaderData = Readonly<LoadDiscord & { inquiryUrl: string }>
export const loader = async (args: Route.LoaderArgs) =>
  Response.json(
    {
      ...loadDiscord(args),
      inquiryUrl: args.context.cloudflare.env.GOOGLE_FORM_INQUIRY,
    },
    {
      headers: {
        'Cache-Control': `public, max-age=${args.context.cloudflare.env.BASE_LONG_CACHE_TIME}`,
        ETag: new TZDate(2025, 1, 15).toISOString(),
      },
    },
  )
export function headers({ loaderHeaders }: Route.HeadersArgs) {
  return loaderHeaders
}

export default function Index() {
  const indexLoaderData = useLoaderData<IndexLoaderData>()

  return (
    <div className="flex flex-col items-begin justify-begin">
      {lists(indexLoaderData).map(({ caption, id, content }) => (
        <section className="mb-10" key={caption}>
          <h2 id={id} className="underline">
            {caption}
            <Link
              to={`#${id}`}
              className="inline-block ml-2"
              aria-label={`見出し「${caption}」へのアンカー`}
            >
              <LinkIcon className="size-5" />
            </Link>
          </h2>
          <div>{content}</div>
        </section>
      ))}
    </div>
  )
}

type IndexItem = Readonly<{
  caption: string
  id: string
  content: React.ReactNode
}>
const lists = ({ discord, inquiryUrl }: IndexLoaderData): IndexItem[] => [
  {
    caption: 'このページについて',
    id: 'about',
    content: (
      <p>
        {siteName}は、『ARMORED
        CORE』シリーズのやりこみ攻略に特化した非公式コミュニティです。
        このサイトでは、Discord
        サーバーの参加方法、ルール、罰則規定、各種チャレンジのアーカイブを公開し、
        プレイヤー同士の交流・チャレンジとその成果の記録をサポートしています。
      </p>
    ),
  },
  {
    caption: 'コミュニティ用Discordサーバーの利用規約',
    id: 'rule',
    content: (
      <>
        当コミュニティdiscordサーバーの利用規約は<Link to="/rule">こちら</Link>
        から確認できます。
        <ul>
          一例として、以下のような内容が含まれています。
          <li>Discordサーバーの運営方針</li>
          <li>Discordサーバーの利用方法</li>
          <li>禁止行為</li>
        </ul>
        <br />
        Discordサーバーの利用者は必ず目を通してください。
      </>
    ),
  },
  {
    caption: 'コミュニティ用Discordサーバー利用者への罰則規定',
    id: 'penalties',
    content: (
      <>
        当コミュニティdiscordサーバーの利用規約に違反した場合、管理者・運営から罰則を与える場合があります。
        <br />
        詳細は<Link to="/penalties">こちら</Link>からご確認ください。
        <br />
        Discordサーバーの利用者は必ず目を通してください。
      </>
    ),
  },
  {
    caption: 'コミュニティ用Discordサーバーへの参加方法',
    id: 'server',
    content: (
      <>
        以下の招待リンクから、当コミュニテイのDiscordサーバーへ参加できます。
        <br />
        <div className="my-3">
          <Link to={discord.invite}>サーバーへ参加</Link>
          <br />
        </div>
        利用規約・罰則規定を確認・同意いただいた上でご参加ください。
      </>
    ),
  },
  {
    caption: '当ページの更新履歴',
    id: 'updates',
    content: (
      <>
        当ページの更新履歴は<Link to="/updates">こちら</Link>
        からご確認いただけます。
      </>
    ),
  },
  {
    caption: '攻略・チャレンジアーカイブ',
    id: 'archives',
    content: (
      <>
        <p>
          アーマードコアの縛り攻略およびチャレンジ情報を、アーカイブとして公開しています。
          <br />
          アーカイブは<Link to="/archives">こちら</Link>からご確認いただけます。
        </p>
        <ul>
          <li>アーキバスバルテウスのノーダメージ撃破</li>
          <li>スタンニードルランチャー無しでアイスワームをSランク撃破</li>
          <li>マニュアルロックでアイビスを撃破</li>
          <li>他、多数の攻略・チャレンジ情報</li>
        </ul>
        <br />
        <p>アーカイブの閲覧はどなたでも行っていただけます。</p>
        <p>
          アーカイブの登録はDiscordサーバー参加者にのみ開放しています。
          詳細はDiscordーバー内の該当チャンネルにてご確認ください。
        </p>
      </>
    ),
  },
  {
    caption: 'コミュニティへのお問い合わせ',
    id: 'inquiry',
    content: (
      <>
        Discordサーバー加入前に質問・確認したいことがある方は、
        <Link
          to={inquiryUrl}
          title="お問い合わせフォームへ"
          aria-label="お問い合わせフォームへ"
          target="_blank"
          rel="noopener noreferrer"
        >
          こちらのフォーム
        </Link>
        からお願いいたします。
      </>
    ),
  },
  {
    caption: 'ライセンス',
    id: 'license',
    content: (
      <>
        本文書は
        <Link
          to="https://creativecommons.org/licenses/by-nd/4.0"
          target="_blank"
          rel="noreferrer"
        >
          CC BY-ND 4.0
        </Link>
        によってライセンスされています。
        <p className="flex mt-1">
          <Link
            className="flex"
            to="https://creativecommons.org/licenses/by-nd/4.0/?ref=chooser-v1"
            target="_blank"
            rel="license noopener noreferrer"
          >
            <img
              height="22"
              width="22"
              style={{ marginLeft: 3, verticalAlign: 'text-bottom' }}
              src="https://mirrors.creativecommons.org/presskit/icons/cc.svg?ref=chooser-v1"
              alt="Creative Commons CC icon"
            />
            <img
              height="22"
              width="22"
              style={{ marginLeft: 3, verticalAlign: 'text-bottom' }}
              src="https://mirrors.creativecommons.org/presskit/icons/by.svg?ref=chooser-v1"
              alt="Creative Commons BY icon"
            />
            <img
              height="22"
              width="22"
              style={{ marginLeft: 3, verticalAlign: 'text-bottom' }}
              src="https://mirrors.creativecommons.org/presskit/icons/nd.svg?ref=chooser-v1"
              alt="Creative Commons ND icon"
            />
          </Link>
        </p>
      </>
    ),
  },
]

export const meta: Route.MetaFunction = ({ location }) => {
  return [
    ...buildMeta({
      title: 'TOP',
      description: `${unofficialServer}の情報公開サイトです。利用規約・罰則規定・更新履歴・アーカイブなどを公開しています。`,
      pathname: location.pathname,
    }),
  ]
}
