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

  // まず対応ストラテジーを選定（未対応URLはここで例外 = 400）
  const strategy = getOGPStrategy(url, [
    withOGPScanner((url) => twitterPattern.test(url.toString())),
  ])

  // 本関数はテスト分岐を持たない。外部から渡された strategy をそのまま使用する。
  const ogp = await strategy.run(url, env)

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
