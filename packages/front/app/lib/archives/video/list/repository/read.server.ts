import type { Database } from '~/db/driver.server'
import { videoArchives } from '~/db/schema.server'
import { and, asc, count, desc, like, not, or } from 'drizzle-orm'
import type { ReadArchive } from '../entity'
import type {
  Order,
  OrderFunction,
} from '~/lib/archives/common/list/query.server'

type PageArchivesArgs = Readonly<{
  page: number
  order?: Order
  keyword?: string
  source?: 'all' | 'yt' | 'x' | 'nico' | 'other'
}>

// 1, 2, 3, 4列に対応
const countPerPage = 12
const cursor = (page: number): number => countPerPage * (page - 1)

type PageArchivesResult = Readonly<{
  list: readonly ReadArchive[]
  totalPage: number
}>
export async function pageArchives(
  {
    page,
    order = orderByCreated('asc'),
    keyword = '',
    source = 'all',
  }: PageArchivesArgs,
  db: Database,
): Promise<PageArchivesResult> {
  const keywordWhere =
    keyword.length > 0
      ? and(
          ...keyword
            .split(/\s+/)
            .map((k) =>
              or(
                like(videoArchives.title, `%${k}%`),
                like(videoArchives.description, `%${k}%`),
              ),
            ),
        )
      : undefined

  const sourceWhere = (() => {
    switch (source) {
      case 'all':
        return undefined
      case 'yt':
        return or(
          like(videoArchives.url, '%youtube.com%'),
          like(videoArchives.url, '%youtu.be%'),
        )
      case 'x':
        return or(
          like(videoArchives.url, '%x.com%'),
          like(videoArchives.url, '%twitter.com%'),
        )
      case 'nico':
        return or(
          like(videoArchives.url, '%nicovideo.jp%'),
          like(videoArchives.url, '%nico.ms%'),
        )
      case 'other':
        return and(
          ...[
            '%youtube.com%',
            '%youtu.be%',
            '%x.com%',
            '%twitter.com%',
            '%nicovideo.jp%',
            '%nico.ms%',
          ].map((domain) => not(like(videoArchives.url, domain))),
        )
    }
  })()

  const where =
    keywordWhere && sourceWhere
      ? and(keywordWhere, sourceWhere)
      : (keywordWhere ?? sourceWhere)

  const list = await db
    .select()
    .from(videoArchives)
    .where(where)
    .orderBy(...order.order())
    .offset(cursor(page))
    .limit(countPerPage)
  const [total] = await db
    .select({ count: count(videoArchives.id) })
    .from(videoArchives)
    .where(where)
    .all()
  const totalPage = Math.ceil(total.count / countPerPage)

  return { list, totalPage }
}

export const orderByCreated: OrderFunction = (o) => {
  switch (o) {
    case 'asc':
      return {
        order: () => [asc(videoArchives.createdAt), asc(videoArchives.id)],
      }
    case 'desc':
      return {
        order: () => [desc(videoArchives.createdAt), asc(videoArchives.id)],
      }
  }
}
