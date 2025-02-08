/**
 * Archive機能のユースケースレベル処理を配置
 */

import { type ArchiveContents } from './entity.server'
import { createNewArchiveContents } from './factory.server'
import { type GetOGPStrategy } from '~/lib/archives/common/ogp/ogp-strategy.server'
import { type FindArchiveByURL, throwAlreadyArchivedURL } from '~/lib/archives/common/url/find-archive-by-url'
import { PostChallengeArchiveTextBody } from './params.server'

type IODeps = Readonly<{
  env: Env
  getOGPStrategy: GetOGPStrategy
  findArchiveByURL: FindArchiveByURL
}>
/**
 * @throws {ArchiveError}
 */
export async function buildChallengeArchiveFromUrl(
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
    url,
  })
}

export async function buildChallengeArchiveFromText(
  data: PostChallengeArchiveTextBody
): Promise<ArchiveContents> {
  return createNewArchiveContents({
    title: data.title,
    description: data.text,
    url: null,
  })
}
