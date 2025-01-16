import { ErrorData } from '~/lib/error'

export type ArchiveError =
  | UnsupportedUrlError
  | DuplicateUrlError
  | FailedGetOGPError

export const unsupportedUrl = 'unsupported-url'
export type UnsupportedUrlError = ErrorData<typeof unsupportedUrl, {
  url: string
}>

export const duplicatedUrl = 'duplicated-url'
export type DuplicateUrlError = ErrorData<typeof duplicatedUrl, {
  requested: URL
  existing: URL
}>

export const failedGetOGP = 'failed-get-ogp'
export type FailedGetOGPError = ErrorData<typeof failedGetOGP, {
  detail: unknown
}>
