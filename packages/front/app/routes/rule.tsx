import { type LoaderFunction, type MetaFunction, Link, useLoaderData } from 'react-router';
import { ReactElement } from 'react'
import { Margin } from '~/lib/utils/components/spacer'
import { siteName } from '~/lib/constants'
import { LoadDiscord, loadDiscord } from '~/lib/discord/loader.server';
import { buildMeta, unofficialServer } from '~/lib/head/build-meta';

export const meta: MetaFunction = ({ location }) => {
  return buildMeta({
    title: '利用規約',
    description: `${unofficialServer}の利用規約ページです`,
    pathname: location.pathname,
  })
};

export const loader: LoaderFunction = async (args) => ({
  ...loadDiscord(args),
})

export const Rule: React.FC = () => {
  const { discord } = useLoaderData<LoadDiscord>()

  return (
    <>
      <section>
        <h2>利用規約</h2>
        <p>
          このページでは、ファンサーバー「{siteName}」（以下、本サーバー）の利用規約を記載しています
        </p>
        <p>
          本サーバーの利用者は、必ず以下の内容を一読してください
        </p>
        <p>
          また、本サーバーの加入者は全員以下の内容に同意しているものとみなします
        </p>
      </section>
      <div className="border-b my-4" />
      <section>
        <RuleList>
          <RuleItem caption="サーバー方針" hash="policy">
            <li>
              フロム・ソフトウェア開発のゲーム「アーマード・コア」シリーズのストーリー・ミッションやりこみ攻略に関する情報共有を、本サーバーではメインコンテンツとして扱います
              <ul>
                <li>
                  例:
                  <ul>
                    <li>「〇〇縛りでやってみた」「〇〇のミッションでタイムアタックしてみた」「RTAでこんな記録が出せた」</li>
                    <li>「こんな方法が攻略に有効だった」「何に使えるかわからないが、こんなテクニックができた」「こんなルートでタイム短縮できた」</li>
                  </ul>
                </li>
                <li>
                  その他、ミッション攻略にあたり何らかの制約・条件・計測を伴うものは、<b>内容や難易度によらず全て</b>「やりこみ攻略」と捉えます
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
            <li>アーマード・コアに関係しない内容は、本サーバーでは非メインコンテンツとして扱います</li>
            <li>
              非メインコンテンツについて、 専用のフォーラムやチャンネルは設けません。雑談チャンネルをご利用ください
              <ul>
                <li>専用の場が欲しい場合は、雑談チャンネル内で各自スレッドを立ててください</li>
              </ul>
            </li>
          </RuleItem>

          <Margin h={8} />
          <RuleItem caption="方針の決定権" hash="right-to-decide">
            <li>本サーバーの方針について、最終的な決定権は管理者が持ちます</li>
            <li>運営方針について利用者の方々から意見を募る、利用者の方の意見を反映する場合があります</li>
            <li>複数の意見が出てまとまらない場合、最終的な決定は管理者が下します</li>
          </RuleItem>

          <Margin h={8} />
          <RuleItem caption="管理者・運営の指示について" hash="instructions-by-admin">
            <li>
              管理者・運営から利用者に対して、本サーバーの利用方法について何らか指示を行う場合があります。その場合は速やかに指示に従ってください。
              <ul>
                <li>チャンネルやフォーラムの趣旨から著しく逸脱した話題が長く続く場合、適切なチャンネルへの移動を指示することがあります</li>
                <li>サーバールールに違反する言動があると判断した場合、それらの差し止めやメッセージの削除を指示することがあります</li>
                <li>その他公序良俗に反する言動があると判断した場合、それらの差し止めやメッセージの削除を指示することがあります</li>
              </ul>
            </li>
            <li>サーバーの利用方法に関する管理者・運営からの指示に従わない場合、管理者・運営から罰則を与える場合があります。詳細は<Link to="/penalties">罰則規定</Link>を参照してください</li>
          </RuleItem>

          <Margin h={8} />
          <RuleItem caption="チャンネルの利用方法について" hash="usage-of-channels">
            <li>チャンネルを利用する際は、必ずチャンネルトピックを確認してください</li>
            <li>チャンネルを利用する際は、チャンネルトピックに沿った内容を扱ってください</li>
            <li>会話の内容がチャンネルトピックから逸脱してきた場合は、適切なチャンネルやスレッドへ移動してください</li>
            <li>スレッドは各チャンネルで自由に作成してかまいません</li>
          </RuleItem>

          <Margin h={8} />
          <RuleItem caption="要望・不明点について" hash="questions">
            <li>サーバー利用にあたって不明点がある場合は<a href={discord.question}>質問フォーラム</a>へ投稿してください</li>
            <li>サーバー利用にあたって要望や提案がある場合は<a href={discord.suggestion}>提案フォーラム</a>へ投稿してください</li>
          </RuleItem>

          <Margin h={8} />
          <RuleItem caption="トラブルや不適切行為の報告について" hash="trouble-shooting">
            <li>サーバー利用者同士でトラブルが発生した場合は、管理者または運営へDMを送ってください</li>
            <li>サーバー利用者の不適切行為を目撃した場合は、管理者または運営へDMを送ってください</li>
          </RuleItem>

          <Margin h={8} />
          <RuleItem caption="やりとりの外部共有について" hash="sharing">
            <li>
              サーバー内のやりとりを外部共有する場合、管理者または運営の許可を取ってください
              <ul>
                <li>許可の申請は<a href={discord.question}>質問フォーラム</a>で投稿してください</li>
                <li>上記申請は、外部共有の形式（画像・動画・その他）によらず必要です</li>
                <li>上記申請は、外部共有先（SNS・ブログ・メッセージアプリ・その他）によらず必要です</li>
              </ul>
            </li>
            <li>
              ただし、以下の条件を<b>すべて</b>満たす場合には、上記の申請は不要です
              <ul>
                <li>それぞれのメッセージについて、発言者が誰か特定できないように編集されていること</li>
                <li>そのやりとりが当サーバーのものであるとわからないように編集されていること</li>
              </ul>
            </li>
          </RuleItem>

          <Margin h={8} />
          <RuleItem caption="プレイの比較について" hash="not-compare-playing">
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
                <li>本サーバーの趣旨はやりこみ攻略の情報共有です。「より上手い・すごいプレイヤーを決めること」は趣旨に含みません</li>
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
            <li>当事者同士で合意があったとしても、サーバー内での比較行為はご遠慮ください。どうしても行いたい場合は本サーバー以外の、かつ比較行為がルール上許容された場所でお願いします</li>
          </RuleItem>

          <Margin h={8} />
          <RuleItem caption="攻略方法のアドバイスについて" hash="for-advise">
            <li>攻略方法・テクニックの共有・アドバイス・提案について、やりこみの情報共有という観点から、本サーバーでは一般に許可します</li>
            <li>ただし、アドバイスや提案を採用するかどうかの決定権は受け手が持っていることを留意してください。受け手にはそれらを採用しない権利があります</li>
            <li>アドバイス・提案が受け入れられなかったことを理由としての批判・非難はおやめください</li>
          </RuleItem>

          <Margin h={8} />
          <RuleItem caption="ネタバレの取り扱いについて" hash="spoiler">
            <li>本サーバーは「ストーリー・ミッション攻略のやりこみ」を主題とする性質上、各シリーズは一通りクリア済みであることを前提とします。したがって、ネタバレについては特に制限を設けません</li>
            <li>未クリアの状態で本サーバーに参加しても構いません。ただし、ネタバレについては各人で対策してください</li>
            <li>リーク情報やフラゲ情報など、非公式・非正式なルートでのネタバレはタイトル・内容を問わず一律禁止です</li>
          </RuleItem>

          <Margin h={8} />
          <RuleItem caption="禁止コンテンツについて" hash="denied-contents">
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
            <li>これらに類する話題が続く場合は管理者・運営から注意する場合があります</li>
            <li>話題が上記コンテンツに近づいた場合は、速やかに話題を切り替えるなどしてください</li>
            <li>
              これらに類する内容を含む<Link to={{ pathname: '/', hash: 'archives' }}>アーカイブの登録</Link>も禁止となります
            </li>
            <li>
              本サーバー内で上記コンテンツを繰り返し取り扱う場合、管理者・運営から罰則を与える場合があります。
              詳細は<Link to="/penalties">罰則規定</Link>を参照してください
            </li>
          </RuleItem>

          <Margin h={8} />
          <RuleItem caption="他コミュニティの宣伝行為について" hash="advertisement">
            <li>
              アーマードコア関連のコミュニティは自由に宣伝・共有いただいて問題ありません。事前の許可も不要です
              <ul>
                <li>ただし、<Link to={{ hash: 'denied-contents' }}>禁止コンテンツ</Link>を含む場合は、アーマードコア関連であっても宣伝・共有は禁止です</li>
              </ul>
            </li>
            <li>アーマードコアに関連しないコミュニティを宣伝・共有したい場合、質問フォーラムからご相談ください</li>
            <li>
              <Link to={{ hash: 'denied-contents' }}>禁止コンテンツ</Link>を取り扱うコミュニティの宣伝・共有行為は禁止です
            </li>
          </RuleItem>

          <Margin h={8} />
          <RuleItem caption="上記ルールに従わない場合について" hash="penalties">
            <li>上記ルールに従わないことで発生したあらゆるトラブル・問題について、本サーバーの管理者・運営は一切の責任を負いかねます</li>
            <li>上記ルールに従わない場合、管理者・運営から罰則を与える場合があります。詳細は<Link to="/penalties">罰則規定</Link>を参照してください</li>
          </RuleItem>

          <Margin h={8} />
          <RuleItem caption="ルールの変更について" hash="changing-rules">
            <li>上記のルールは事前の告知なく変更される場合があります</li>
            <li>変更があった場合はサーバー内のチャンネルにてお知らせしますので、必ず内容をご確認ください</li>
          </RuleItem>
        </RuleList>
      </section>
    </>
  )
}

type RuleListProps = Readonly<{ children: ReactElement[] }>
const RuleList: React.FC<RuleListProps> = ({ children }) => <ol className='ml-8'>{children}</ol>

type RuleItemProps = Readonly<{
  caption: string
  hash: string
  children: ReactElement[]
}>
const RuleItem: React.FC<RuleItemProps> = ({ caption, hash, children }) => (
  <li className='text-lg'>
    <Link to={{ hash }} id={hash}>{caption}</Link>
    <ol className='text-sm'>
      {children}
    </ol>
  </li>
)

export default Rule
