import type { Database } from '~/db/driver.server'
import { challengeArchives } from '~/db/schema.server'
import { and, asc, count, desc, like, or } from 'drizzle-orm'
import type { ReadArchive } from '../entity'
import type {
  OrderFunction,
  Order,
} from '~/lib/archives/common/list/query.server'

type PageArchivesArgs = Readonly<{
  page: number
  order?: Order
  keyword?: string
}>

// 1, 2, 3, 4列に対応
const countPerPage = 12
const cursor = (page: number): number => countPerPage * (page - 1)

type PageArchivesResult = Readonly<{
  list: readonly ReadArchive[]
  totalPage: number
}>
export async function pageArchives(
  { page, order = orderByCreated('asc'), keyword = '' }: PageArchivesArgs,
  db: Database,
): Promise<PageArchivesResult> {
  const where =
    keyword.length > 0
      ? and(
          ...keyword
            .split(/\s+/)
            .map((k) =>
              or(
                like(challengeArchives.title, `%${k}%`),
                like(challengeArchives.description, `%${k}%`),
              ),
            ),
        )
      : undefined

  const list = await db
    .select()
    .from(challengeArchives)
    .where(where)
    .orderBy(...order.order())
    .offset(cursor(page))
    .limit(countPerPage)
  const [total] = await db
    .select({ count: count(challengeArchives.id) })
    .from(challengeArchives)
    .where(where)
    .all()
  const totalPage = Math.ceil(total.count / countPerPage)

  return { list, totalPage }
}

export const orderByCreated: OrderFunction = (o) => {
  switch (o) {
    case 'asc':
      return {
        order: () => [
          asc(challengeArchives.createdAt),
          asc(challengeArchives.id),
        ],
      }
    case 'desc':
      return {
        order: () => [
          desc(challengeArchives.createdAt),
          asc(challengeArchives.id),
        ],
      }
  }
}

export async function allArchives(
  db: Database,
): Promise<readonly ReadArchive[]> {
  return db
    .select()
    .from(challengeArchives)
    .orderBy(desc(challengeArchives.createdAt), asc(challengeArchives.id))
}
