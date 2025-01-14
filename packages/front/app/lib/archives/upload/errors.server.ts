import { ErrorData } from '~/lib/error'

export type ArchiveError =
  | UnsupportedUrlError
  | FailedGetOGPError

export const unsupportedUrl = 'unsupported-url'
export type UnsupportedUrlError = ErrorData<{
  url: string
}>

export const failedGetOGP = 'failed-get-ogp'
export type FailedGetOGPError = ErrorData<{
  detail: unknown
}>
