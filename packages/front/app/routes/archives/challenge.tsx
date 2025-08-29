import { Form, Link, useLoaderData, Outlet, useParams } from 'react-router'
import React, { type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { type ReadArchive } from '~/lib/archives/challenge/read/entity'
import { orderQueryKeys, orderQueryMap } from '~/lib/archives/common/list/query'
import {
  type QuerySchema,
  querySchema,
} from '~/lib/archives/common/list/query.server'
import {
  orderByCreated,
  pageArchives,
} from '~/lib/archives/challenge/read/repository/read.server'
import { buildMeta, unofficialServer } from '~/lib/head/build-meta'
import { Margin } from '~/lib/utils/components/spacer'
import type { Route } from './+types/challenge'
import { WithChildren, WithClassName } from '~/lib/utils/components/types'
import { Description } from '~/lib/archives/common/components/description'
import { getChallengeArchiveListRevision } from '~/lib/archives/challenge/revision/repository'
import { parseQuery } from '~/lib/http/request/parser.server'

type LoadArchives = Readonly<{
  totalPage: number
  archives: readonly ReadArchive[]
  query: Omit<QuerySchema, 'o'> &
    Readonly<{
      o: QuerySchema['o']['key']
    }>
}>
export const loader = async ({ context, request, params }: Route.LoaderArgs) => {
  // If this is a detail route (has an externalId parameter), don't load listing data
  if (params.externalId) {
    return Response.json(null, {
      headers: {
        'Cache-Control': `public, max-age=${context.cloudflare.env.BASE_SHORT_CACHE_TIME}`,
      },
    })
  }

  const query = parseQuery(request, querySchema(orderByCreated))

  const { list: archives, totalPage } = await pageArchives(
    {
      page: query.p,
      order: query.o.order,
      keyword: query.k,
    },
    context.db,
  )
  const revision = await getChallengeArchiveListRevision(context.db)

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
const ChallengeArchives: React.FC = () => {
  const params = useParams()
  const loaderData = useLoaderData<LoadArchives | null>()
  const { register, setValue } = useForm<QuerySchema>()

  const isDetailRoute = !!params.externalId

  // If we're on a detail route, render the outlet (detail page)
  if (isDetailRoute) {
    return <Outlet />
  }

  // If no loader data (shouldn't happen for listing route), return error
  if (!loaderData) {
    return (
      <div
        style={{
          color: 'red',
          padding: '1em',
          border: '1px solid #f00',
          borderRadius: '4px',
          background: '#fff0f0',
        }}
      >
        <h3>チャレンジアーカイブを読み込めません</h3>
        <p>
          アーカイブデータを取得できませんでした。ネットワークの問題、サーバーエラー、または予期しない問題が原因の可能性があります。
        </p>
        <p>
          ページを更新してください。問題が解決しない場合は、サポートに連絡するか、しばらく時間をおいて再度お試しください。
        </p>
        <Link to="/">ホームに戻る</Link>
      </div>
    )
  }

  const { archives, totalPage, query } = loaderData
  const page = query.p

  return (
    <>
      <h2>チャレンジアーカイブ</h2>

      <Margin h={32} />

      <Form action="/archives/challenge" method="GET">
        <FormItem labelFor="keyword" label="キーワード検索">
          <input
            className="px-2 ac-border"
            id="keyword"
            type="text"
            defaultValue={query.k}
            {...register('k')}
          />
          <Margin w={16} />
          <button
            className="rounded-md px-2 ac-border"
            type="button"
            onClick={() => {
              setValue('k', '')
            }}
          >
            ✕
          </button>
        </FormItem>
        <Margin h={16} />
        <FormItem labelFor="order" label="並び替え">
          <select
            className="px-2 ac-border"
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
        <Margin h={16} />
        <button type="submit" className="ac-border rounded-md px-4 py-1">
          適用
        </button>
      </Form>

      <hr className="my-10" />

      <ArchiveTable className="w-full">
        {archives.map((a) => (
          <ArchiveRow
            key={a.externalId}
            id={a.externalId}
            title={a.title}
            description={a.description}
            url={a.url}
          />
        ))}
      </ArchiveTable>
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
            pathname: '/archives/challenge',
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

const ArchiveTable: React.FC<WithChildren & WithClassName> = ({
  children,
  className,
}) => (
  <table className={'table-fixed ' + className}>
    <thead className="h-20">
      <tr>
        <th className="w-3/12 border-b dark:border-b-gray-300">タイトル</th>
        <th className="w-6/12 border-b dark:border-b-gray-300">説明</th>
        <th className="w-3/12 border-b dark:border-b-gray-300">出典</th>
      </tr>
    </thead>
    <tbody>{children}</tbody>
  </table>
)

type ArchiveRowProps = Readonly<{
  id: string
  title: string
  description: string
  url: string | null
}>
const ArchiveRow: React.FC<ArchiveRowProps> = ({
  id,
  title,
  description,
  url,
}) => {
  return (
    <tr className="h-36 border-b dark:border-b-gray-300">
      <td className="text-center">
        <div
          className={`m-auto h-12 line-clamp-2 overflow-hidden whitespace-normal text-ellipsis`}
        >
          <Link to={`/archives/challenge/${id}`}>{title}</Link>
        </div>
      </td>
      <td>
        <Description
          description={description}
          className={`m-auto h-24 w-11/12 line-clamp-4 overflow-hidden whitespace-normal text-ellipsis`}
        />
      </td>
      <td className="text-center">
        {url ? (
          <a
            href={url}
            title={title}
            target="_blank"
            rel="noopener noreferrer"
            className={`line-clamp-1 overflow-hidden whitespace-normal text-ellipsis`}
          >
            {url}
          </a>
        ) : (
          '無し'
        )}
      </td>
    </tr>
  )
}

export const meta: Route.MetaFunction = ({ location }) => {
  return [
    ...buildMeta({
      title: 'チャレンジアーカイブ',
      description: [
        `${unofficialServer}で登録された、各チャレンジ情報のアーカイブです。`,
        `様々な縛り・条件のチャレンジ情報を掲載しています。`,
      ].join(''),
      pathname: location.pathname,
    }),
  ]
}

export const handle = {
  breadcrumb: 'チャレンジ',
}

export default ChallengeArchives
