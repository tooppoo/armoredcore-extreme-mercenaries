import { data, Link, useLoaderData } from 'react-router'
import { ReactElement } from 'react'
import { LinkIcon } from '@heroicons/react/16/solid'
import { siteName } from '~/lib/constants'
import { LoadDiscord, loadDiscord } from '~/lib/discord/loader.server'
import { buildMeta, unofficialServer } from '~/lib/head/build-meta'
import type { Route } from './+types/rule'
import { TZDate } from '@date-fns/tz'

export const meta: Route.MetaFunction = ({ location }) => {
  return buildMeta({
    title: '利用規約',
    description: `${unofficialServer}の利用規約ページです。discordサーバーの利用にあたって守るべきルールを記載しています`,
    pathname: location.pathname,
  })
}

export const loader = async (args: Route.LoaderArgs) =>
  data(
    {
      ...loadDiscord(args),
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
  breadcrumb: '利用規約',
}

export const Rule: React.FC = () => {
  const { discord } = useLoaderData<LoadDiscord>()

  return (
    <>
      <style>{`
        .terms-page {
          max-width: 56rem;
          margin-left: auto;
          margin-right: auto;
          padding-left: 1.5rem;
          padding-right: 1.5rem;
          padding-top: 2rem;
          padding-bottom: 2rem;
        }

        .terms-header {
          margin-bottom: 2rem;
        }

        .terms-title {
          font-size: 1.875rem;
          line-height: 2.25rem;
          font-weight: 700;
          color: rgb(17 24 39);
          margin-bottom: 1.5rem;
          border-bottom-width: 2px;
          border-bottom-color: rgb(59 130 246);
          padding-bottom: 0.75rem;
        }

        @media (prefers-color-scheme: dark) {
          .terms-title {
            color: rgb(243 244 246);
          }
        }

        .terms-intro {
          font-size: 1.125rem;
          line-height: 1.75rem;
          color: rgb(55 65 81);
          line-height: 1.625;
          margin-bottom: 1rem;
        }

        .terms-intro:last-child {
          margin-bottom: 0;
        }

        @media (prefers-color-scheme: dark) {
          .terms-intro {
            color: rgb(209 213 219);
          }
        }

        .terms-divider {
          border-top-width: 1px;
          border-top-color: rgb(209 213 219);
          margin-top: 2rem;
          margin-bottom: 2rem;
          margin-left: auto;
          margin-right: auto;
          width: 75%;
        }

        @media (prefers-color-scheme: dark) {
          .terms-divider {
            border-top-color: rgb(75 85 99);
          }
        }

        .terms-content {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .rule-list {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          counter-reset: rule-counter;
        }

        .rule-item {
          background-color: rgb(255 255 255);
          border-radius: 0.5rem;
          padding: 1.5rem;
          border-width: 1px;
          border-color: rgb(229 231 235);
          box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
          transition-property: box-shadow;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 200ms;
          counter-increment: rule-counter;
        }

        .rule-item:hover {
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        }

        @media (prefers-color-scheme: dark) {
          .rule-item {
            background-color: rgb(31 41 55);
            border-color: rgb(55 65 81);
          }
        }

        .rule-item:nth-child(odd) {
          background-color: rgb(239 246 255);
          border-color: rgb(191 219 254);
        }

        @media (prefers-color-scheme: dark) {
          .rule-item:nth-child(odd) {
            background-color: rgb(30 58 138 / 0.1);
            border-color: rgb(30 64 175 / 0.5);
          }
        }

        .rule-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .rule-number {
          background-color: rgb(59 130 246);
          color: rgb(255 255 255);
          border-radius: 9999px;
          width: 2rem;
          height: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
          line-height: 1.25rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        .rule-number::before {
          content: counter(rule-counter);
        }

        .rule-title {
          font-size: 1.25rem;
          line-height: 1.75rem;
          font-weight: 600;
          color: rgb(17 24 39);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex: 1;
        }

        @media (prefers-color-scheme: dark) {
          .rule-title {
            color: rgb(243 244 246);
          }
        }

        .rule-anchor {
          color: rgb(59 130 246);
          transition-property: color;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 200ms;
        }

        .rule-anchor:hover {
          color: rgb(37 99 235);
        }

        @media (prefers-color-scheme: dark) {
          .rule-anchor {
            color: rgb(96 165 250);
          }
          .rule-anchor:hover {
            color: rgb(147 197 253);
          }
        }

        .rule-content {
          color: rgb(55 65 81);
          line-height: 1.625;
        }

        @media (prefers-color-scheme: dark) {
          .rule-content {
            color: rgb(209 213 219);
          }
        }

        .rule-content ol {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-left: 1.5rem;
        }

        .rule-content li {
          position: relative;
        }

        .rule-content li::marker {
          color: rgb(59 130 246);
          font-weight: 600;
        }

        .rule-content ul {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-left: 1.5rem;
          margin-top: 0.5rem;
        }

        .rule-content ul li {
          position: relative;
        }

        .rule-content ul li::before {
          content: "•";
          color: rgb(59 130 246);
          font-weight: 700;
          position: absolute;
          left: -1rem;
        }

        .rule-content b {
          font-weight: 600;
          color: rgb(17 24 39);
        }

        @media (prefers-color-scheme: dark) {
          .rule-content b {
            color: rgb(243 244 246);
          }
        }

        .rule-content a {
          color: rgb(37 99 235);
          text-decoration: underline;
          text-decoration-thickness: 2px;
          text-underline-offset: 2px;
          transition-property: color;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 200ms;
        }

        .rule-content a:hover {
          color: rgb(29 78 216);
          text-decoration-color: rgb(59 130 246);
        }

        @media (prefers-color-scheme: dark) {
          .rule-content a {
            color: rgb(96 165 250);
          }
          .rule-content a:hover {
            color: rgb(147 197 253);
          }
        }

        @media (max-width: 768px) {
          .terms-page {
            padding-left: 1rem;
            padding-right: 1rem;
            padding-top: 1.5rem;
            padding-bottom: 1.5rem;
          }

          .terms-title {
            font-size: 1.5rem;
            line-height: 2rem;
          }

          .rule-item {
            padding: 1rem;
          }

          .rule-title {
            font-size: 1.125rem;
            line-height: 1.75rem;
          }
        }
      `}</style>
      <div className="terms-page">
        <header className="terms-header">
          <h2 className="terms-title">利用規約</h2>
          <p className="terms-intro">
            このページでは、ファンサーバー「{siteName}
            」（以下、本サーバー）の利用規約を記載しています
          </p>
          <p className="terms-intro">本サーバーの利用者は、必ず以下の内容を一読してください</p>
          <p className="terms-intro">
            また、本サーバーの加入者は全員以下の内容に同意しているものとみなします
          </p>
        </header>
        <div className="terms-divider" />
        <section className="terms-content">
        <RuleList>
          <RuleItem caption="サーバー方針" id="policy">
            <li>
              フロム・ソフトウェア開発のゲーム「アーマード・コア」シリーズのストーリー・ミッションやりこみ攻略に関する情報共有を、本サーバーではメインコンテンツとして扱います
              <ul>
                <li>
                  例:
                  <ul>
                    <li>
                      「〇〇縛りでやってみた」「〇〇のミッションでタイムアタックしてみた」「RTAでこんな記録が出せた」
                    </li>
                    <li>
                      「こんな方法が攻略に有効だった」「何に使えるかわからないが、こんなテクニックができた」「こんなルートでタイム短縮できた」
                    </li>
                  </ul>
                </li>
                <li>
                  その他、ミッション攻略にあたり何らかの制約・条件・計測を伴うものは、
                  <b>内容や難易度によらず全て</b>「やりこみ攻略」と捉えます
                </li>
              </ul>
            </li>
            <li>
              ストーリー・ミッションのやりこみ攻略に関係無い内容は、本サーバーでは非メインコンテンツとして扱います
              <ul>
                <li>
                  例:
                  <ul>
                    <li>カスタムマッチ、ランクマッチといった対人関連</li>
                    <li>デカール・エンブレム関連</li>
                  </ul>
                </li>
              </ul>
            </li>
            <li>
              アーマード・コアに関係しない内容は、本サーバーでは非メインコンテンツとして扱います
            </li>
            <li>
              非メインコンテンツについて、
              専用のフォーラムやチャンネルは設けません。雑談チャンネルをご利用ください
              <ul>
                <li>
                  専用の場が欲しい場合は、雑談チャンネル内で各自スレッドを立ててください
                </li>
              </ul>
            </li>
          </RuleItem>

          <RuleItem caption="方針の決定権" id="right-to-decide">
            <li>本サーバーの方針について、最終的な決定権は管理者が持ちます</li>
            <li>
              運営方針について利用者の方々から意見を募る、利用者の方の意見を反映する場合があります
            </li>
            <li>
              複数の意見が出てまとまらない場合、最終的な決定は管理者が下します
            </li>
          </RuleItem>

          <RuleItem
            caption="管理者・運営の指示について"
            id="instructions-by-admin"
          >
            <li>
              管理者・運営から利用者に対して、本サーバーの利用方法について何らか指示を行う場合があります。その場合は速やかに指示に従ってください。
              <ul>
                <li>
                  チャンネルやフォーラムの趣旨から著しく逸脱した話題が長く続く場合、適切なチャンネルへの移動を指示することがあります
                </li>
                <li>
                  サーバールールに違反する言動があると判断した場合、それらの差し止めやメッセージの削除を指示することがあります
                </li>
                <li>
                  その他公序良俗に反する言動があると判断した場合、それらの差し止めやメッセージの削除を指示することがあります
                </li>
              </ul>
            </li>
            <li>
              サーバーの利用方法に関する管理者・運営からの指示に従わない場合、管理者・運営から罰則を与える場合があります。詳細は
              <Link to="/penalties">罰則規定</Link>を参照してください
            </li>
          </RuleItem>

          <RuleItem
            caption="チャンネルの利用方法について"
            id="usage-of-channels"
          >
            <li>
              チャンネルを利用する際は、必ずチャンネルトピックを確認してください
            </li>
            <li>
              チャンネルを利用する際は、チャンネルトピックに沿った内容を扱ってください
            </li>
            <li>
              会話の内容がチャンネルトピックから逸脱してきた場合は、適切なチャンネルやスレッドへ移動してください
            </li>
            <li>スレッドは各チャンネルで自由に作成してかまいません</li>
          </RuleItem>

          <RuleItem caption="要望・不明点について" id="questions">
            <li>
              サーバー利用にあたって不明点がある場合は
              <Link to={discord.question}>質問フォーラム</Link>
              へ投稿してください
            </li>
            <li>
              サーバー利用にあたって要望や提案がある場合は
              <Link to={discord.suggestion}>提案フォーラム</Link>
              へ投稿してください
            </li>
          </RuleItem>

          <RuleItem
            caption="トラブルや不適切行為の報告について"
            id="trouble-shooting"
          >
            <li>
              サーバー利用者同士でトラブルが発生した場合は、管理者または運営へDMを送ってください
            </li>
            <li>
              サーバー利用者の不適切行為を目撃した場合は、管理者または運営へDMを送ってください
            </li>
          </RuleItem>

          <RuleItem caption="やりとりの外部共有について" id="sharing">
            <li>
              サーバー内のやりとりを外部共有する場合、管理者または運営の許可を取ってください
              <ul>
                <li>
                  許可の申請は<a href={discord.question}>質問フォーラム</a>
                  で投稿してください
                </li>
                <li>
                  上記申請は、外部共有の形式（画像・動画・その他）によらず必要です
                </li>
                <li>
                  上記申請は、外部共有先（SNS・ブログ・メッセージアプリ・その他）によらず必要です
                </li>
              </ul>
            </li>
            <li>
              ただし、以下の条件を<b>すべて</b>
              満たす場合には、上記の申請は不要です
              <ul>
                <li>
                  それぞれのメッセージについて、発言者が誰か特定できないように編集されていること
                </li>
                <li>
                  そのやりとりが当サーバーのものであるとわからないように編集されていること
                </li>
              </ul>
            </li>
          </RuleItem>

          <RuleItem caption="プレイの比較について" id="not-compare-playing">
            <li>
              プレイ内容やプレイ結果に優劣をつける比較は禁止します
              <ul>
                <li>
                  NG例:
                  <ul>
                    <li>この縛りの方が◯◯縛りより難しい</li>
                    <li>◯◯さんの方が上手かった</li>
                    <li>◯◯さんよりXX分早くクリアできた</li>
                  </ul>
                </li>
                <li>
                  本サーバーの趣旨はやりこみ攻略の情報共有です。「より上手い・すごいプレイヤーを決めること」は趣旨に含みません
                </li>
              </ul>
            </li>
            <li>
              報告はあくまで結果の報告に留め、他プレイヤーとの比較は避けてください
              <ul>
                <li>
                  OK例:
                  <ul>
                    <li>〇〇縛りで全ボスを撃破できた</li>
                    <li>〇〇をXX分でクリアできた</li>
                  </ul>
                </li>
              </ul>
            </li>
            <li>
              当事者同士で合意があったとしても、サーバー内での比較行為はご遠慮ください。どうしても行いたい場合は本サーバー以外の、かつ比較行為がルール上許容された場所でお願いします
            </li>
          </RuleItem>

          <RuleItem caption="攻略方法のアドバイスについて" id="for-advise">
            <li>
              攻略方法・テクニックの共有・アドバイス・提案について、やりこみの情報共有という観点から、本サーバーでは一般に許可します
            </li>
            <li>
              ただし、アドバイスや提案を採用するかどうかの決定権は受け手が持っていることを留意してください。受け手にはそれらを採用しない権利があります
            </li>
            <li>
              アドバイス・提案が受け入れられなかったことを理由としての批判・非難はおやめください
            </li>
          </RuleItem>

          <RuleItem caption="ネタバレの取り扱いについて" id="spoiler">
            <li>
              本サーバーは「ストーリー・ミッション攻略のやりこみ」を主題とする性質上、各シリーズは一通りクリア済みであることを前提とします。したがって、ネタバレについては特に制限を設けません
            </li>
            <li>
              未クリアの状態で本サーバーに参加しても構いません。ただし、ネタバレについては各人で対策してください
            </li>
            <li>
              リーク情報やフラゲ情報など、非公式・非正式なルートでのネタバレはタイトル・内容を問わず一律禁止です
            </li>
          </RuleItem>

          <RuleItem caption="禁止コンテンツについて" id="denied-contents">
            <li>
              以下に該当するコンテンツについて、本サーバーでは取り扱いを禁止します
              <ul>
                <li>政治</li>
                <li>宗教</li>
                <li>社会ニュース</li>
                <li>アダルト</li>
                <li>犯罪</li>
                <li>実在する人物・企業・組織・製品への強い否定・非難</li>
                <li>その他、公序良俗に反する話題</li>
              </ul>
            </li>
            <li>
              これらに類する話題が続く場合は管理者・運営から注意する場合があります
            </li>
            <li>
              話題が上記コンテンツに近づいた場合は、速やかに話題を切り替えるなどしてください
            </li>
            <li>
              これらに類する内容を含む
              <Link to={{ pathname: '/', hash: 'archives' }}>
                アーカイブの登録
              </Link>
              も禁止となります
            </li>
            <li>
              本サーバー内で上記コンテンツを繰り返し取り扱う場合、管理者・運営から罰則を与える場合があります。
              詳細は<Link to="/penalties">罰則規定</Link>を参照してください
            </li>
          </RuleItem>

          <RuleItem
            caption="他コミュニティの宣伝行為について"
            id="advertisement"
          >
            <li>
              アーマードコア関連のコミュニティは自由に宣伝・共有いただいて問題ありません。事前の許可も不要です
              <ul>
                <li>
                  ただし、
                  <Link to={{ hash: 'denied-contents' }}>禁止コンテンツ</Link>
                  を含む場合は、アーマードコア関連であっても宣伝・共有は禁止です
                </li>
              </ul>
            </li>
            <li>
              アーマードコアに関連しないコミュニティを宣伝・共有したい場合、質問フォーラムからご相談ください
            </li>
            <li>
              <Link to={{ hash: 'denied-contents' }}>禁止コンテンツ</Link>
              を取り扱うコミュニティの宣伝・共有行為は禁止です
            </li>
          </RuleItem>

          <RuleItem caption="上記ルールに従わない場合について" id="penalties">
            <li>
              上記ルールに従わないことで発生したあらゆるトラブル・問題について、本サーバーの管理者・運営は一切の責任を負いかねます
            </li>
            <li>
              上記ルールに従わない場合、管理者・運営から罰則を与える場合があります。詳細は
              <Link to="/penalties">罰則規定</Link>を参照してください
            </li>
          </RuleItem>

          <RuleItem caption="ルールの変更について" id="changing-rules">
            <li>上記のルールは事前の告知なく変更される場合があります</li>
            <li>
              変更があった場合はサーバー内のチャンネルにてお知らせしますので、必ず内容をご確認ください
            </li>
          </RuleItem>
        </RuleList>
        </section>
      </div>
    </>
  )
}

type RuleListProps = Readonly<{ children: ReactElement[] }>
const RuleList: React.FC<RuleListProps> = ({ children }) => (
  <div className="rule-list">{children}</div>
)

type RuleItemProps = Readonly<{
  caption: string
  id: string
  children: ReactElement[]
}>
const RuleItem: React.FC<RuleItemProps> = ({ caption, id, children }) => (
  <article className="rule-item">
    <header className="rule-header">
      <div className="rule-number" aria-hidden="true"></div>
      <h3 className="rule-title">
        {caption}
        <Link
          to={{ hash: id }}
          id={id}
          className="rule-anchor"
          aria-label={`見出し「${caption}」へのアンカー`}
        >
          <LinkIcon className="size-4" />
        </Link>
      </h3>
    </header>
    <div className="rule-content">
      <ol>{children}</ol>
    </div>
  </article>
)

export default Rule
