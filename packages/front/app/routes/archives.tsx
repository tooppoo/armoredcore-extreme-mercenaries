import { LoaderFunction, MetaFunction } from '@remix-run/cloudflare'
import { Form, Link, useLoaderData } from '@remix-run/react'
import { ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zx } from 'zodix'
import { type ReadArchive } from '~/lib/archives/list/entity'
import { orderQueryKeys, orderQueryMap } from '~/lib/archives/list/query'
import { QuerySchema, querySchema } from '~/lib/archives/list/query.server'
import { pageArchives } from '~/lib/archives/list/repository/read.server'
import { buildMeta, unofficialServer } from '~/lib/head/build-meta'
import { Hr, Margin } from '~/lib/utils/components/spacer'
import { serverOnly$ } from 'vite-env-only/macros'

type LoadArchives = Readonly<{
  totalPage: number
  archives: readonly ReadArchive[]
  query: Omit<QuerySchema, 'o'> & Readonly<{
    o: QuerySchema['o']['key']
  }>
}>
export const loader: LoaderFunction = async ({ context, request }) => {
  const query = zx.parseQuery(request, querySchema)

  const {
    list: archives,
    totalPage,
  } = await pageArchives({
    page: query.p,
    order: query.o.order,
    keyword: query.k,
  }, context.db)

  // https://github.com/jacobparis/remix-cloudflare-drizzle
  return Response.json({
    totalPage,
    archives,
    query: {
      ...query,
      o: query.o.key,
    },
  } satisfies LoadArchives)
}

// クエリ用なので略記名
const Archives: React.FC = () => {
  const { archives, totalPage, query } = useLoaderData<LoadArchives>()
  const {
    register,
    setValue,
  } = useForm<QuerySchema>()

  const page = query.p

  return (
    <>
      <h2>攻略動画アーカイブ</h2>

      <Margin h={32} />

      <Form action="/archives" method="GET">
        <FormItem labelFor="keyword" label="キーワード検索">
          <input
            className="px-2 border"
            id="keyword" type="text" defaultValue={query.k}
            {...register('k')}
          />
          <Margin w={16} />
          <button
            className="border rounded-md px-2"
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
            className="px-2 border"
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
        <button
          type='submit'
          className='border rounded-md px-4 py-1'
        >
          適用
        </button>
      </Form>

      <Hr h={64} />

      <section
        className={[
          "grid",
          "grid-cols-1 gap-1",
          "sm:grid-cols-2 sm:gap-2",
          "md:grid-cols-3 md:gap-3",
          "lg:grid-cols-4 lg:gap-4",
        ].join(' ')}
      >
        {archives.map((a) => (
          <ArchiveItem
            key={a.externalId}
            title={a.title}
            description={a.description}
            url={a.url}
            imageUrl={a.imageUrl}
            height='min-h-64 sm:min-h-72 lg:min-h-80'
          />
        ))}
      </section>
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
const FormItem: React.FC<FormItemProps> = ({ labelFor: id, label, children }) => (
  <div className='block sm:flex'>
    <label className='w-32' htmlFor={id}>
      {label}
    </label>
    <div className='flex'>
      {children}
    </div>
  </div>
)

type MovePageProps = Readonly<{
  page: number
  totalPage: number
  children: string
  query: Record<string, number | string>
}>
const MovePage: React.FC<MovePageProps> = ({ page, totalPage, children, query }) => {
  return (
    <div className="h-9 w-9 flex justify-center items-center">
      {
        1 <= page && page <= totalPage
        ? <Link
            to={{
              pathname: '/archives',
              search: new URLSearchParams({ ...query, p: `${page}` }).toString(),
            }}
          >
            {children}
          </Link>
        : <span>
            {children}
          </span>
      }
    </div>
  )
}

export type ArchiveItemProps = Readonly<{
  title: string
  description: string
  imageUrl: string
  url: string
  height?: string
}>
export const ArchiveItem: React.FC<ArchiveItemProps> = ({
  title,
  description,
  imageUrl,
  url,
  height = ''
}) => {
  return (
    <a
      href={url}
      className={`${height} flex flex-col justify-between p-2 border-b dark:hover:bg-gray-700`}
    >
      <div
        className={`h-6 overflow-hidden whitespace-nowrap text-ellipsis`}
      >
        {title}
      </div>
      <div />
      <img
        src={imageUrl} alt={description}
      />
      <div />
      <div
        className={`h-6 overflow-hidden whitespace-nowrap text-ellipsis`}
      >
        {description}
      </div>
    </a>
  )
}

export const meta = serverOnly$<MetaFunction>(({ location }) => {
  return [
    ...buildMeta({
      title: '攻略動画アーカイブ',
      description: [
        `${unofficialServer}で登録された、攻略動画のアーカイブです。`,
        `各条件での縛り攻略・タイムアタック動画へのリンクを掲載しています。`,
      ].join(''),
      pathname: location.pathname,
    })
  ];
});

export default Archives
