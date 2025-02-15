import { format } from 'date-fns'
import { ReadUpdate } from '~/lib/updates/entity.server'
import { records, Update } from '~/lib/updates/repository/record.server'
import { h } from '~/lib/utils/sanitize.server'
import { parseHtml } from '~/lib/utils/html-parser'

type PageUpdatesArgs = Readonly<{
  page: number
}>
export async function pageUpdates({
  page,
}: PageUpdatesArgs): Promise<ReadUpdate[]> {
  return records[page - 1]
    .map(transform)
    .toSorted((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
}

type FindUpdateArgs = Readonly<{
  externalId: string
}>
export async function findUpdate({
  externalId,
}: FindUpdateArgs): Promise<ReadUpdate | undefined> {
  const r = records.flat().find((r) => r.externalId === externalId)

  return r ? transform(r) : r
}

function transform(r: Update): ReadUpdate {
  return {
    ...r,
    caption: `${r.title} - ${format(r.createdAt, 'yyyy/MM/dd')}`,
    content: parseHtml(h(r.content)),
  }
}
