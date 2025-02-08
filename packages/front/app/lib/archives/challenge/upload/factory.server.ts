import type { ArchiveContents } from './entity.server';
import { v7 as uuid7 } from 'uuid'

type NewArchiveContents = Omit<ArchiveContents, 'externalId'>
export function createNewArchiveContents(args: NewArchiveContents): ArchiveContents {
  return {
    externalId: uuid7(),
    ...args,
  }
}
