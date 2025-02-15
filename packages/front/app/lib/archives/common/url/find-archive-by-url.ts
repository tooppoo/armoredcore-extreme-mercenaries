import { duplicatedUrl, DuplicateUrlError } from '../errors.server'

type DuplicatedArchive = Readonly<{
  externalId: string
}>
export type FindArchiveByURL = (url: URL) => Promise<DuplicatedArchive | null>
export function throwAlreadyArchivedURL(
  url: URL,
  archive: DuplicatedArchive,
): never {
  throw {
    code: duplicatedUrl,
    message: `${url.toString()} is already archived`,
    detail: {
      requested: url.toString(),
      existing: archive.externalId,
    },
  } satisfies DuplicateUrlError
}
