import { Form, Link, useLoaderData } from 'react-router'
import { type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { type ReadArchive } from '~/lib/archives/video/list/entity'
import { orderQueryKeys, orderQueryMap } from '~/lib/archives/common/list/query'
import {
  type QuerySchema,
  querySchema,
} from '~/lib/archives/common/list/query.server'
import {
  orderByCreated,
  pageArchives,
} from '~/lib/archives/video/list/repository/read.server'
import { buildMeta, unofficialServer } from '~/lib/head/build-meta'
import { Margin } from '~/lib/utils/components/spacer'
import type { Route } from './+types/video'
import { getVideoArchiveListRevision } from '~/lib/archives/video/revision/repository'
import { parseQuery } from '~/lib/http/request/parser.server'
import { ArchiveCardItem, ArchiveListItem } from '~/lib/archives/video/components/ArchiveItems'

type LoadArchives = Readonly<{
  totalPage: number
  archives: readonly ReadArchive[]
  query: Omit<QuerySchema, 'o'> &
    Readonly<{
      o: QuerySchema['o']['key']
    }>
}>
export const loader = async ({ context, request }: Route.LoaderArgs) => {
  const query = parseQuery(request, querySchema(orderByCreated))

  const { list: archives, totalPage } = await pageArchives(
    {
      page: query.p,
      order: query.o.order,
      keyword: query.k,
      source: query.s,
    },
    context.db,
  )
  const revision = await getVideoArchiveListRevision(context.db)

  // https://github.com/jacobparis/remix-cloudflare-drizzle
  return Response.json(
    {
      totalPage,
      archives,
      query: {
        ...query,
        o: query.o.key,
      },
    } satisfies LoadArchives,
    {
      headers: {
        'Cache-Control': `public, max-age=${context.cloudflare.env.BASE_SHORT_CACHE_TIME}`,
        ETag: `${revision}`,
      },
    },
  )
}
export function headers({ loaderHeaders }: Route.HeadersArgs) {
  return loaderHeaders
}

// クエリ用なので略記名
const VideoArchives: React.FC = () => {
  const { archives, totalPage, query } = useLoaderData<LoadArchives>()
  const { register, setValue } = useForm<QuerySchema>()

  const page = query.p

  return (
    <>
      <h2>攻略動画アーカイブ</h2>

      <Margin h={32} />

      <Form
        action="/archives/video"
        method="GET"
        aria-label="動画アーカイブ検索フォーム"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <FormItem labelFor="keyword" label="キーワード検索">
            <input
              className="px-2 ac-border w-64"
              id="keyword"
              type="text"
              placeholder="タイトル・説明で検索 (空白区切りAND)"
              defaultValue={query.k}
              {...register('k')}
            />
            <Margin w={12} />
            <button
              className="rounded-md px-2 ac-border"
              type="button"
              onClick={() => {
                setValue('k', '')
              }}
              aria-label="キーワードをクリア"
            >
              ✕
            </button>
          </FormItem>

          <FormItem labelFor="source" label="動画サイト">
            <select
              className="px-2 ac-border w-64"
              id="source"
              defaultValue={query.s}
              {...register('s')}
            >
              <option value="all">すべて</option>
              <option value="yt">YouTube</option>
              <option value="x">X(Twitter)</option>
              <option value="nico">ニコニコ動画</option>
            </select>
          </FormItem>

          <FormItem labelFor="order" label="並び替え">
            <select
              className="px-2 ac-border w-64"
              id="order"
              defaultValue={query.o}
              {...register('o')}
            >
              {orderQueryKeys.map((key) => (
                <option value={key} key={key}>
                  {orderQueryMap[key].label}
                </option>
              ))}
            </select>
          </FormItem>

          <FormItem labelFor="view" label="表示モード">
            <select
              className="px-2 ac-border w-64"
              id="view"
              defaultValue={query.v}
              {...register('v')}
            >
              <option value="card">カード</option>
              <option value="list">リスト</option>
            </select>
          </FormItem>
        </div>

        <Margin h={16} />
        <button type="submit" className="ac-border rounded-md px-4 py-1">
          適用
        </button>
      </Form>

      <hr className="my-10" />

      {query.v === 'list' ? (
        <section
          aria-label="動画アーカイブ一覧（リスト）"
          className="space-y-3"
        >
          {archives.map((a) => (
            <ArchiveListItem
              key={a.externalId}
              title={a.title}
              description={a.description}
              url={a.url}
              imageUrl={a.imageUrl}
              createdAt={a.createdAt}
            />
          ))}
        </section>
      ) : (
        <section
          className={[
            'grid',
            'grid-cols-1 gap-4',
            'sm:grid-cols-2 sm:gap-4',
            'md:grid-cols-3 md:gap-4',
            'lg:grid-cols-4 lg:gap-6',
          ].join(' ')}
          aria-label="動画アーカイブ一覧（カード）"
        >
          {archives.map((a) => (
            <ArchiveCardItem
              key={a.externalId}
              title={a.title}
              description={a.description}
              url={a.url}
              imageUrl={a.imageUrl}
              createdAt={a.createdAt}
            />
          ))}
        </section>
      )}
      <Margin h={32} />
      <section className="flex justify-center items-center">
        <MovePage page={1} {...{ totalPage, query }}>
          &lt;&lt;
        </MovePage>
        <MovePage page={page - 1} {...{ totalPage, query }}>
          &lt;
        </MovePage>

        {page}

        <MovePage page={page + 1} {...{ totalPage, query }}>
          &gt;
        </MovePage>
        <MovePage page={totalPage} {...{ totalPage, query }}>
          &gt;&gt;
        </MovePage>
      </section>
    </>
  )
}

type FormItemProps = Readonly<{
  labelFor: string
  label: string
  children: ReactNode
}>
const FormItem: React.FC<FormItemProps> = ({
  labelFor: id,
  label,
  children,
}) => (
  <div className="block sm:flex">
    <label className="w-32" htmlFor={id}>
      {label}
    </label>
    <div className="flex">{children}</div>
  </div>
)

type MovePageProps = Readonly<{
  page: number
  totalPage: number
  children: string
  query: Record<string, number | string>
}>
const MovePage: React.FC<MovePageProps> = ({
  page,
  totalPage,
  children,
  query,
}) => {
  return (
    <div className="h-9 w-9 flex justify-center items-center">
      {1 <= page && page <= totalPage ? (
        <Link
          to={{
            pathname: '/archives/video',
            search: new URLSearchParams({ ...query, p: `${page}` }).toString(),
          }}
        >
          {children}
        </Link>
      ) : (
        <span>{children}</span>
      )}
    </div>
  )
}

export const meta: Route.MetaFunction = ({ location }) => {
  return [
    ...buildMeta({
      title: '攻略動画アーカイブ',
      description: [
        `${unofficialServer}で登録された、攻略動画のアーカイブです。`,
        `各条件での縛り攻略・タイムアタック動画へのリンクを掲載しています。`,
      ].join(''),
      pathname: location.pathname,
    }),
  ]
}

export const handle = {
  breadcrumb: '動画アーカイブ',
  layout: 'wide',
}

export default VideoArchives
