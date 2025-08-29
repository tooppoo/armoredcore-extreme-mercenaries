import type { Route } from './+types/index'
import { Link, useLoaderData } from 'react-router'
import { LinkIcon } from '@heroicons/react/16/solid'
import { siteName } from '~/lib/constants'
import { LoadDiscord, loadDiscord } from '~/lib/discord/loader.server'
import { buildMeta } from '~/lib/head/build-meta'
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

export const handle = {
  breadcrumb: 'TOP'
}

export default function Index() {
  const indexLoaderData = useLoaderData<IndexLoaderData>()

  return (
    <>
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
    </>
  )
}

type IndexItem = Readonly<{
  caption: string
  id: string
  content: React.ReactNode
}>
const lists = ({ discord, inquiryUrl }: IndexLoaderData): IndexItem[] => [
  {
    caption: '本コミュニティについて',
    id: 'about',
    content: (
      <section>
        <p>
          {siteName}は、ARMORED
          COREシリーズのやりこみ攻略・チャレンジに関する情報をまとめた非公式コミュニティです。
          <br />
          経験者・初心者を問わず、全てのプレイヤーが交流や情報共有、独自チャレンジの記録・閲覧を行える場を提供しています。
        </p>
        <br />
        <p>
          本コミュニティは有志メンバーによって運営されています。
          <br />
          Discordサーバーではメンバー同士の情報共有や質問対応などが行われています。
          <br />
          小規模ながらも、ルールや運営方針を明確にし、安心して利用できる環境づくりを心がけています。
        </p>
        <br />
        <p>
          攻略・チャレンジのアーカイブやDiscord案内、ルール・罰則規定・更新履歴なども公開中です。シリーズ未経験者や復帰勢も歓迎していますので、ぜひご活用ください。
        </p>
      </section>
    ),
  },
  {
    caption: 'FAQ',
    id: 'faq',
    content: (
      <section>
        <ul>
          <li>
            <strong>Q. 初心者でも参加できますか？</strong>
            <br />
            A.
            はい、初心者の方も歓迎しています。Discord内で質問も受け付けています。
          </li>
          <li>
            <strong>Q. アーカイブへ攻略・チャレンジを投稿する方法は？</strong>
            <br />
            A.
            Discordサーバーの専用チャンネルで受付中です。詳細は参加後にご確認いただけます。
          </li>
          <li>
            <strong>Q. サイトの情報は誰がまとめていますか？</strong>
            <br />
            A. 運営メンバーの<Link to="https://x.com/Philomagi">Philomagi</Link>
            によって更新されています。
          </li>
        </ul>
      </section>
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
      title: 'ARMORED CORE EXTREME MERCENARIES 非公式コミュニティ',
      description:
        'ARMORED COREシリーズのやりこみ攻略・独自チャレンジ・縛りプレイの体験談やノウハウを集約した非公式コミュニティ。Discord案内・アーカイブ・ルール・FAQも掲載。初心者も歓迎。',
      pathname: location.pathname,
    }),
    {
      // FAQ構造化データ
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: '初心者でも参加できますか？',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'はい、初心者の方も歓迎しています。Discord内で質問も受け付けています。',
            },
          },
          {
            '@type': 'Question',
            name: '攻略・チャレンジの投稿方法は？',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Discordサーバーの専用チャンネルで受付中です。詳細は参加後にご案内します。',
            },
          },
          {
            '@type': 'Question',
            name: 'サイトの情報は誰がまとめていますか？',
            acceptedAnswer: {
              '@type': 'Answer',
              text: '有志メンバーが実際のプレイ体験をもとにまとめています。',
            },
          },
        ],
      },
    },
  ]
}
