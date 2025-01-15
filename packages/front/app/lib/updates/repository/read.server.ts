import { format } from 'date-fns'
import { ReadUpdate } from '~/lib/updates/entity.server'
import { records, Update } from '~/lib/updates/repository/record.server'

type PageUpdatesArgs = Readonly<{
  page: number
}>
export async function pageUpdates({ page }: PageUpdatesArgs): Promise<ReadUpdate[]> {
  return records[page].map(transform)
}

type FindUpdateArgs = Readonly<{
  externalId: string
}>
export async function findUpdate({ externalId }: FindUpdateArgs): Promise<ReadUpdate | undefined> {
  const r = records.flat().find(r => r.externalId === externalId)

  return r ? transform(r) : r
}

function transform(r: Update): ReadUpdate {
  return {
    ...r,
    caption: `${r.title} - ${format(r.createdAt, 'yyyy/MM/dd')}`,
  }
}
