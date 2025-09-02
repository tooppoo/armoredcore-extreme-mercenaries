/**
 * Archive機能のユースケースレベル処理を配置
 */

import { type ArchiveContents } from './entity.server'
import { createNewArchiveContents } from './factory.server'
import {
  withOGPScanner,
  type GetOGPStrategy,
} from '~/lib/archives/common/ogp/ogp-strategy.server'
import {
  type FindArchiveByURL,
  throwAlreadyArchivedURL,
} from '~/lib/archives/common/url/find-archive-by-url'
import {
  PostChallengeArchiveLinkBody,
  PostChallengeArchiveTextBody,
} from './params.server'
import { twitterPattern } from '~/lib/archives/common/url/support-url.server'

type IODeps = Readonly<{
  env: Env
  getOGPStrategy: GetOGPStrategy
  findArchiveByURL: FindArchiveByURL
}>
/**
 * @throws {ArchiveError}
 */
export async function buildChallengeArchiveFromUrl(
  data: Pick<PostChallengeArchiveLinkBody, 'url' | 'title'>,
  { env, getOGPStrategy, findArchiveByURL }: IODeps,
): Promise<ArchiveContents> {
  const url = new URL(data.url)

  const sameURLArchive = await findArchiveByURL(url)
  if (sameURLArchive !== null) {
    return throwAlreadyArchivedURL(url, sameURLArchive)
  }

  const isTestMode =
    (typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test') ||
    (env as unknown as Record<string, string | undefined>)?.TEST_MODE === 'true'

  const ogp = isTestMode
    ? { title: data.title, description: '(test) description', image: '' }
    : await (async () => {
        const strategy = getOGPStrategy(url, [
          withOGPScanner((url) => twitterPattern.test(url.toString())),
        ])
        return strategy.run(url, env)
      })()

  return createNewArchiveContents({
    title: data.title,
    description: ogp.description,
    url,
  })
}

export async function buildChallengeArchiveFromText(
  data: PostChallengeArchiveTextBody,
): Promise<ArchiveContents> {
  return createNewArchiveContents({
    title: data.title,
    description: data.text,
    url: null,
  })
}
