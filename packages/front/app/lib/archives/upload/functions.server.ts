/**
 * Archive機能のユースケースレベル処理を配置
 */

import { ArchiveContents } from '~/lib/archives/upload/entity.server'
import { createNewArchiveContents } from '~/lib/archives/upload/factory.server'
import { type GetOGPStrategy } from '~/lib/archives/upload/ogp/ogp-strategy.server'
import { duplicatedUrl, DuplicateUrlError, failedGetOGP, FailedGetOGPError, unsupportedUrl, type UnsupportedUrlError } from '~/lib/archives/upload/errors.server'
import { makeCatchesSerializable } from '~/lib/error'

export type SearchSameURLArchive = (url: URL) => Promise<ArchiveContents | null>

type IODeps = Readonly<{
  getOGPStrategy: GetOGPStrategy
  findByURL: SearchSameURLArchive
}>
/**
 * @throws {ArchiveError}
 */
export async function buildArchiveFromUrl(
  url: URL,
  {
    getOGPStrategy,
    findByURL,
  }: IODeps
): Promise<ArchiveContents> {
  const strategy = getOGPStrategy(url)
  if (strategy === null) {
    throw {
      code: unsupportedUrl,
      message: `${url.toString()} is not supported`,
      url: url.toString(),
    } satisfies UnsupportedUrlError
  }

  const sameURLArchive = await findByURL(url)
  if (sameURLArchive !== null) {
    throw {
      code: duplicatedUrl,
      message: `${url.toString()} is already archived`,
      requested: url,
      existing: new URL(sameURLArchive.url),
    } satisfies DuplicateUrlError
  }

  const ogp = await strategy(url).catch((error) => {
    throw {
      code: failedGetOGP,
      message: error instanceof Error
        ? error.message
        : JSON.stringify(error),
      detail: makeCatchesSerializable(error),
    } satisfies FailedGetOGPError
  })

  return createNewArchiveContents({
    title: ogp.title,
    description: ogp.description,
    imageUrl: new URL(ogp.image),
    url,
  })
}
