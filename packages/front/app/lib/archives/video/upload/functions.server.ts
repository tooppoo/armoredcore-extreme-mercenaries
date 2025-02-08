/**
 * Archive機能のユースケースレベル処理を配置
 */

import { type ArchiveContents } from '~/lib/archives/video/upload/entity.server'
import { createNewArchiveContents } from '~/lib/archives/video/upload/factory.server'
import { type GetOGPStrategy } from '~/lib/archives/common/ogp/ogp-strategy.server'
import { type FindArchiveByURL, throwAlreadyArchivedURL } from '~/lib/archives/common/url/find-archive-by-url'

type IODeps = Readonly<{
  env: Env
  getOGPStrategy: GetOGPStrategy
  findArchiveByURL: FindArchiveByURL
}>
/**
 * @throws {ArchiveError}
 */
export async function buildVideoArchiveFromUrl(
  url: URL,
  {
    env,
    getOGPStrategy,
    findArchiveByURL,
  }: IODeps
): Promise<ArchiveContents> {
  const strategy = getOGPStrategy(url)

  const sameURLArchive = await findArchiveByURL(url)
  if (sameURLArchive !== null) {
    return throwAlreadyArchivedURL(url, sameURLArchive)
  }

  const ogp = await strategy(url, env)

  return createNewArchiveContents({
    title: ogp.title,
    description: ogp.description,
    imageUrl: new URL(ogp.image),
    url,
  })
}
