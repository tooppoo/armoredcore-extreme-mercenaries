import { Database } from '~/db/driver.server'
import { archives } from '~/db/schema.server'
import { and, asc, count, desc, like, or, SQL } from 'drizzle-orm'
import { ReadArchive } from '~/lib/archives/list/entity'

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
  {
    page,
    order = orderByCreated('asc'),
    keyword = '',
  }: PageArchivesArgs,
  db: Database
): Promise<PageArchivesResult> {
  const where = keyword.length > 0
    ? and(
        ...keyword.split(/\s+/).map((k) => or(
          like(archives.title, `%${k}%`),
          like(archives.description, `%${k}%`),
        ))
      )
    : undefined

  const list = await db
    .select()
    .from(archives)
    .where(where)
    .orderBy(...order.order())
    .offset(cursor(page))
    .limit(countPerPage)
  const [total] = await db.select({ count: count(archives.id) }).from(archives).where(where).all()
  const totalPage = Math.ceil(total.count / countPerPage)

  return { list, totalPage }
}

type OrderDirection = 'asc' | 'desc'
type Order = Readonly<{
  order(): [SQL, SQL]
}>
type OrderFunction = (o: OrderDirection) => Order

export const orderByCreated: OrderFunction = (o) => {
  switch (o) {
    case 'asc':
      return {
        order: () => [asc(archives.createdAt), asc(archives.id)],
      }
    case 'desc':
      return {
        order: () => [desc(archives.createdAt), asc(archives.id)],
      }
  }
}
