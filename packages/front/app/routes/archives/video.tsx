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
import { WithChildren } from '~/lib/utils/components/types'
import { Description } from '~/lib/archives/common/components/description'
import { getVideoArchiveListRevision } from '~/lib/archives/video/revision/repository'
import { parseQuery } from '~/lib/http/request/parser.server'

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

      <Form action="/archives/video" method="GET" aria-label="動画アーカイブ検索フォーム">
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
              <option value="twitch">Twitch</option>
              <option value="nico">ニコニコ</option>
              <option value="other">その他</option>
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
              defaultValue={(query as any).v}
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

      {(query as any).v === 'list' ? (
        <section aria-label="動画アーカイブ一覧（リスト）" className="space-y-3">
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
            <ArchiveItem
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

export type ArchiveItemProps = Readonly<{
  title: string
  description: string
  imageUrl: string
  url: string
  createdAt: unknown
}>
export const ArchiveItem: React.FC<ArchiveItemProps> = ({
  title,
  description,
  imageUrl,
  url,
  createdAt,
}) => {
  const hostname = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, '')
    } catch {
      return ''
    }
  })()
  const sourceLabel = (() => {
    if (hostname.includes('youtube') || hostname.includes('youtu.be'))
      return 'YouTube'
    if (hostname.includes('x.com') || hostname.includes('twitter')) return 'X'
    if (hostname.includes('twitch')) return 'Twitch'
    if (hostname.includes('nico')) return 'ニコニコ'
    return 'その他'
  })()
  const created = (() => {
    try {
      const d = new Date(createdAt as any)
      return d.toLocaleDateString('ja-JP')
    } catch {
      return ''
    }
  })()
  return (
    <a
      href={url}
      title={title}
      target="_blank"
      rel="noopener noreferrer"
      className="archive-item rounded-md overflow-hidden flex flex-col ac-border ac-hover"
      aria-label={title}
    >
      <div className="p-3 flex items-center justify-between text-xs">
        <span className="rounded-sm px-2 py-0.5 ac-border text-gray-700 dark:text-gray-200">
          {sourceLabel}
        </span>
        <span aria-label="登録日" className="text-gray-500">
          {created}
        </span>
      </div>
      <div className="bg-black/5 dark:bg-white/5 aspect-video w-full overflow-hidden">
        <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
      </div>
      <div className="p-3 flex flex-col gap-2">
        <ArchiveItemCaption>{title}</ArchiveItemCaption>
        <ArchiveItemDescription>
          <Description description={description} />
        </ArchiveItemDescription>
      </div>
    </a>
  )
}
const ArchiveItemCaption: React.FC<WithChildren> = ({ children }) => (
  <div
    className={`min-h-12 line-clamp-2 overflow-hidden whitespace-normal text-ellipsis font-medium`}
  >
    {children}
  </div>
)
const ArchiveItemDescription: React.FC<WithChildren> = ({ children }) => (
  <div className={`min-h-16 line-clamp-3 overflow-hidden whitespace-normal text-ellipsis text-sm`}>{children}</div>
)

type ArchiveListItemProps = ArchiveItemProps
const ArchiveListItem: React.FC<ArchiveListItemProps> = ({
  title,
  description,
  imageUrl,
  url,
  createdAt,
}) => {
  const hostname = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, '')
    } catch {
      return ''
    }
  })()
  const sourceLabel = (() => {
    if (hostname.includes('youtube') || hostname.includes('youtu.be'))
      return 'YouTube'
    if (hostname.includes('x.com') || hostname.includes('twitter')) return 'X'
    if (hostname.includes('twitch')) return 'Twitch'
    if (hostname.includes('nico')) return 'ニコニコ'
    return 'その他'
  })()
  const created = (() => {
    try {
      const d = new Date(createdAt as any)
      return d.toLocaleDateString('ja-JP')
    } catch {
      return ''
    }
  })()
  return (
    <a
      href={url}
      title={title}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 items-start p-2 ac-border rounded-md ac-hover"
      aria-label={title}
    >
      <div className="w-28 shrink-0 aspect-video overflow-hidden rounded-sm bg-black/5 dark:bg-white/5">
        <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs mb-1">
          <span className="rounded-sm px-2 py-0.5 ac-border text-gray-700 dark:text-gray-200">{sourceLabel}</span>
          <span className="text-gray-500">{created}</span>
        </div>
        <div className="font-medium line-clamp-2">{title}</div>
        <div className="text-sm line-clamp-2 text-gray-700 dark:text-gray-200">
          <Description description={description} />
        </div>
      </div>
    </a>
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
