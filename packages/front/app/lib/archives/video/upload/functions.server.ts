/**
 * Archive機能のユースケースレベル処理を配置
 */

import { ArchiveContents } from '~/lib/archives/video/upload/entity.server'
import { createNewArchiveContents } from '~/lib/archives/video/upload/factory.server'
import { type GetOGPStrategy } from '~/lib/archives/common/ogp/ogp-strategy.server'
import { duplicatedUrl, DuplicateUrlError, failedGetOGP, FailedGetOGPError, unsupportedUrl, type UnsupportedUrlError } from '~/lib/archives/common/errors.server'
import { makeCatchesSerializable } from '~/lib/error'

export type SearchSameURLArchive = (url: URL) => Promise<ArchiveContents | null>

type IODeps = Readonly<{
  env: Env
  getOGPStrategy: GetOGPStrategy
  findByURL: SearchSameURLArchive
}>
/**
 * @throws {ArchiveError}
 */
export async function buildArchiveFromUrl(
  url: URL,
  {
    env,
    getOGPStrategy,
    findByURL,
  }: IODeps
): Promise<ArchiveContents> {
  const strategy = getOGPStrategy(url)
  if (strategy === null) {
    throw {
      code: unsupportedUrl,
      message: `${url.toString()} is not supported`,
      detail: {
        url: url.toString(),
      }
    } satisfies UnsupportedUrlError
  }

  const sameURLArchive = await findByURL(url)
  if (sameURLArchive !== null) {
    throw {
      code: duplicatedUrl,
      message: `${url.toString()} is already archived`,
      detail: {
        requested: url.toString(),
        existing: sameURLArchive.url.toString(),
      }
    } satisfies DuplicateUrlError
  }

  const ogp = await strategy(url, env).catch((error) => {
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
