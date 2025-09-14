import type { Route } from './+types/index'
import { Link, useLoaderData } from 'react-router'
import { LinkIcon } from '@heroicons/react/16/solid'
import { siteName } from '~/lib/constants'
import { LoadDiscord, loadDiscord } from '~/lib/discord/loader.server'
import { buildMeta } from '~/lib/head/build-meta'
import { LinkCard } from '~/lib/utils/components/LinkCard'
import {
  getLatestVideoArchives,
  getLatestChallengeArchives,
} from '~/lib/archives/latest/repository.server'
import { getLatestUpdates } from '~/lib/updates/repository/read.server'
import type { ReadUpdate } from '~/lib/updates/entity.server'
import { ArchiveCardItem } from '~/lib/archives/video/components/ArchiveItems'
import {
  ArchiveTable,
  ArchiveRow,
} from '~/lib/archives/challenge/components/ArchiveTable'

type IndexLoaderData = Readonly<
  LoadDiscord & {
    inquiryUrl: string
    latestVideos: Awaited<ReturnType<typeof getLatestVideoArchives>>
    latestChallenges: Awaited<ReturnType<typeof getLatestChallengeArchives>>
    latestUpdates: ReadUpdate[]
  }
>
export const loader = async (args: Route.LoaderArgs) => {
  const [latestVideos, latestChallenges, latestUpdates] = await Promise.all([
    getLatestVideoArchives(args.context.db, 3),
    getLatestChallengeArchives(args.context.db, 3),
    getLatestUpdates(3),
  ])

  return Response.json(
    {
      ...loadDiscord(args),
      inquiryUrl: args.context.cloudflare.env.GOOGLE_FORM_INQUIRY,
      latestVideos,
      latestChallenges,
      latestUpdates,
    },
    {
      headers: {
        'Cache-Control': `public, max-age=${args.context.cloudflare.env.BASE_SHORT_CACHE_TIME}`,
        ETag: `index-${(() => {
          const ts = [
            ...latestVideos.map((v) => new Date(v.createdAt).getTime()),
            ...latestChallenges.map((c) => new Date(c.createdAt).getTime()),
            ...latestUpdates.map((u) => new Date(u.createdAt).getTime()),
          ]
          return ts.length ? Math.max(...ts) : 0
        })()}-${latestVideos.length}-${latestChallenges.length}-${latestUpdates.length}`,
      },
    },
  )
}
export function headers({ loaderHeaders }: Route.HeadersArgs) {
  return loaderHeaders
}

export const handle = {
  breadcrumb: 'TOP',
}

export default function Index() {
  const indexLoaderData = useLoaderData<IndexLoaderData>()

  return (
    <main className="content-group" role="main" aria-label="メインコンテンツ">
      {lists(indexLoaderData).map(({ caption, id, content }) => (
        <section className="content-section" key={caption} aria-labelledby={id}>
          <header>
            <h2 id={id} className="section-heading">
              <span>{caption}</span>
              <Link
                to={`#${id}`}
                className="anchor-link"
                aria-label={`セクション「${caption}」へのアンカーリンク`}
                title={`${caption}セクションへのリンク`}
              >
                <LinkIcon className="size-4" aria-hidden="true" />
              </Link>
            </h2>
          </header>
          <div className="content-text" role="region" aria-labelledby={id}>
            {content}
          </div>
        </section>
      ))}
    </main>
  )
}

type IndexItem = Readonly<{
  caption: string
  id: string
  content: React.ReactNode
}>
const lists = ({
  discord,
  inquiryUrl,
  latestVideos,
  latestChallenges,
  latestUpdates,
}: IndexLoaderData): IndexItem[] => [
  {
    caption: '最新チャレンジ情報',
    id: 'latest-challenges',
    content: (
      <>
        <p>最新の攻略・チャレンジ情報をご紹介します。</p>
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-3">最新攻略動画</h4>
          {latestVideos.length > 0 ? (
            <section
              className={[
                'grid',
                'grid-cols-1 gap-4',
                'sm:grid-cols-2 sm:gap-4',
                'md:grid-cols-3 md:gap-4',
              ].join(' ')}
              aria-label="最新攻略動画一覧"
            >
              {latestVideos.map((video) => (
                <ArchiveCardItem
                  key={video.id}
                  title={video.title}
                  description={video.description}
                  url={video.url}
                  imageUrl={video.imageUrl}
                  createdAt={video.createdAt}
                />
              ))}
            </section>
          ) : (
            <p className="text-gray-500">まだ動画が登録されていません</p>
          )}
        </div>
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-3">最新チャレンジ</h4>
          {latestChallenges.length > 0 ? (
            <ArchiveTable className="w-full">
              {latestChallenges.map((challenge) => (
                <ArchiveRow
                  key={challenge.id}
                  id={challenge.externalId}
                  title={challenge.title}
                  description={challenge.description}
                  url={challenge.url}
                  showDetailLink={false}
                />
              ))}
            </ArchiveTable>
          ) : (
            <p className="text-gray-500">まだチャレンジが登録されていません</p>
          )}
        </div>
        <div className="highlight-box mt-6">
          <LinkCard
            to="/archives"
            type="internal"
            aria-label="攻略・チャレンジアーカイブページへ移動"
          >
            すべてのアーカイブを見る
          </LinkCard>
        </div>
      </>
    ),
  },
  {
    caption: '更新履歴の抜粋',
    id: 'recent-updates',
    content: (
      <>
        <p>最近の更新情報をご紹介します。</p>
        {latestUpdates.length > 0 ? (
          <ul className="content-list mt-4 space-y-2">
            {latestUpdates.map((update) => (
              <li key={update.externalId}>
                <LinkCard
                  to={`/updates/${update.externalId}`}
                  type="internal"
                  aria-label={`${update.caption}の詳細ページへ移動`}
                >
                  {update.caption}
                </LinkCard>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 mt-4">まだ更新情報がありません</p>
        )}
        <div className="highlight-box mt-6">
          <LinkCard
            to="/updates"
            type="internal"
            aria-label="更新履歴ページへ移動"
          >
            すべての更新履歴を見る
          </LinkCard>
        </div>
      </>
    ),
  },
  {
    caption: '本コミュニティについて',
    id: 'about',
    content: (
      <>
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
      </>
    ),
  },
  {
    caption: 'FAQ',
    id: 'faq',
    content: (
      <section aria-label="よくある質問">
        <div className="content-list">
          <article className="faq-item">
            <h3 className="faq-question">Q. 初心者でも参加できますか？</h3>
            <div className="faq-answer">
              A.
              はい、初心者の方も歓迎しています。Discord内で質問も受け付けています。
            </div>
          </article>
          <article className="faq-item">
            <h3 className="faq-question">
              Q. アーカイブへ攻略・チャレンジを投稿する方法は？
            </h3>
            <div className="faq-answer">
              A.
              Discordサーバーの専用チャンネルで受付中です。詳細は参加後にご確認いただけます。
            </div>
          </article>
          <article className="faq-item">
            <h3 className="faq-question">
              Q. サイトの情報は誰がまとめていますか？
            </h3>
            <div className="faq-answer">
              A. 運営メンバーの
              <LinkCard
                to="https://x.com/Philomagi"
                type="external"
                aria-label="Philomagi氏のXプロフィール（新しいタブで開く）"
              >
                Philomagi
              </LinkCard>
              によって更新されています。
            </div>
          </article>
        </div>
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
        </p>
        <div className="highlight-box">
          <LinkCard
            to="/archives"
            type="internal"
            aria-label="攻略・チャレンジアーカイブページへ移動"
          >
            攻略・チャレンジアーカイブを見る
          </LinkCard>
        </div>
        <h4 className="text-lg font-semibold mt-6 mb-3">アーカイブ掲載例</h4>
        <ul className="content-list">
          <li>アーキバスバルテウスのノーダメージ撃破</li>
          <li>スタンニードルランチャー無しでアイスワームをSランク撃破</li>
          <li>マニュアルロックでアイビスを撃破</li>
          <li>他、多数の攻略・チャレンジ情報</li>
        </ul>
        <div className="mt-6 space-y-3">
          <p>
            <strong>閲覧について：</strong>
            アーカイブの閲覧はどなたでも行っていただけます。
          </p>
          <p>
            <strong>投稿について：</strong>
            アーカイブの登録はDiscordサーバー参加者にのみ開放しています。詳細はDiscordサーバー内の該当チャンネルにてご確認ください。
          </p>
        </div>
      </>
    ),
  },
  {
    caption: 'コミュニティ用Discordサーバーの利用規約',
    id: 'rule',
    content: (
      <>
        <div className="highlight-box">
          <LinkCard
            to="/rule"
            type="internal"
            aria-label="Discordサーバー利用規約ページへ移動"
          >
            利用規約を確認する
          </LinkCard>
        </div>
        <h4 className="text-lg font-semibold mt-6 mb-3">
          規約に含まれる主な内容
        </h4>
        <ul className="content-list">
          <li>Discordサーバーの運営方針</li>
          <li>Discordサーバーの利用方法</li>
          <li>禁止行為</li>
        </ul>
        <p className="mt-4 font-semibold text-amber-700 dark:text-amber-300">
          ⚠️ Discordサーバーの利用者は必ず目を通してください。
        </p>
      </>
    ),
  },
  {
    caption: 'コミュニティ用Discordサーバー利用者への罰則規定',
    id: 'penalties',
    content: (
      <>
        <p>
          当コミュニティDiscordサーバーの利用規約に違反した場合、管理者・運営から罰則を与える場合があります。
        </p>
        <div className="highlight-box">
          <LinkCard
            to="/penalties"
            type="internal"
            aria-label="罰則規定ページへ移動"
          >
            罰則規定を確認する
          </LinkCard>
        </div>
        <p className="mt-4 font-semibold text-amber-700 dark:text-amber-300">
          ⚠️ Discordサーバーの利用者は必ず目を通してください。
        </p>
      </>
    ),
  },
  {
    caption: 'コミュニティ用Discordサーバーへの参加方法',
    id: 'server',
    content: (
      <>
        <p>
          以下の招待リンクから、当コミュニティのDiscordサーバーへ参加できます。
        </p>
        <div className="highlight-box">
          <LinkCard
            to={discord.invite}
            type="external"
            aria-label="Discordサーバーに参加（新しいタブで開く）"
          >
            Discordサーバーに参加する
          </LinkCard>
        </div>
        <p className="mt-4 font-semibold text-blue-700 dark:text-blue-300">
          💡 利用規約・罰則規定を確認・同意いただいた上でご参加ください。
        </p>
      </>
    ),
  },
  {
    caption: 'コミュニティへのお問い合わせ',
    id: 'inquiry',
    content: (
      <>
        <p>
          Discordサーバー加入前に質問・確認したいことがある方は、お問い合わせフォームをご利用ください。
        </p>
        <div className="highlight-box">
          <LinkCard
            to={inquiryUrl}
            type="external"
            aria-label="お問い合わせフォームへ移動（新しいタブで開く）"
          >
            お問い合わせフォームを開く
          </LinkCard>
        </div>
      </>
    ),
  },
  {
    caption: '当ページの更新履歴',
    id: 'updates',
    content: (
      <>
        <p>当サイトの変更履歴や新機能の追加情報をご確認いただけます。</p>
        <div className="highlight-box">
          <LinkCard
            to="/updates"
            type="internal"
            aria-label="更新履歴ページへ移動"
          >
            更新履歴を見る
          </LinkCard>
        </div>
      </>
    ),
  },
  {
    caption: 'ライセンス',
    id: 'license',
    content: (
      <>
        <p>
          本文書は
          <LinkCard
            to="https://creativecommons.org/licenses/by-nd/4.0"
            type="external"
            aria-label="Creative Commons BY-ND 4.0ライセンス詳細（新しいタブで開く）"
          >
            CC BY-ND 4.0
          </LinkCard>
          によってライセンスされています。
        </p>
        <div className="mt-4">
          <Link
            className="link-card link-card--external"
            to="https://creativecommons.org/licenses/by-nd/4.0/?ref=chooser-v1"
            target="_blank"
            rel="license noopener noreferrer"
            aria-label="Creative Commonsライセンス詳細ページ（新しいタブで開く）"
          >
            <span className="flex items-center gap-2">
              <span>ライセンス詳細を見る</span>
              <div className="flex items-center">
                <img
                  height="22"
                  width="22"
                  src="https://mirrors.creativecommons.org/presskit/icons/cc.svg?ref=chooser-v1"
                  alt="Creative Commons CC icon"
                  className="inline-block"
                />
                <img
                  height="22"
                  width="22"
                  src="https://mirrors.creativecommons.org/presskit/icons/by.svg?ref=chooser-v1"
                  alt="Creative Commons BY icon"
                  className="inline-block ml-1"
                />
                <img
                  height="22"
                  width="22"
                  src="https://mirrors.creativecommons.org/presskit/icons/nd.svg?ref=chooser-v1"
                  alt="Creative Commons ND icon"
                  className="inline-block ml-1"
                />
              </div>
            </span>
            <span className="sr-only">（外部サイト）</span>
          </Link>
        </div>
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
