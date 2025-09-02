/**
 * Archive機能のユースケースレベル処理を配置
 */

import { type ArchiveContents } from '~/lib/archives/video/upload/entity.server'
import { createNewArchiveContents } from '~/lib/archives/video/upload/factory.server'
import {
  withOGPScanner,
  withYouTubeData,
  type GetOGPStrategy,
} from '~/lib/archives/common/ogp/ogp-strategy.server'
import {
  type FindArchiveByURL,
  throwAlreadyArchivedURL,
} from '~/lib/archives/common/url/find-archive-by-url'
import {
  niconicoPattern,
  twitterPattern,
} from '~/lib/archives/common/url/support-url.server'

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
  { env, getOGPStrategy, findArchiveByURL }: IODeps,
): Promise<ArchiveContents> {
  const sameURLArchive = await findArchiveByURL(url)
  if (sameURLArchive !== null) {
    return throwAlreadyArchivedURL(url, sameURLArchive)
  }

  // まず対応ストラテジーを選定（未対応URLはここで例外 = 400）
  const strategy = getOGPStrategy(url, [
    withYouTubeData(),
    withOGPScanner(
      (url) =>
        niconicoPattern.test(url.toString()) ||
        twitterPattern.test(url.toString()),
    ),
  ])

  // 本関数はテスト分岐を持たない。外部から渡された strategy をそのまま使用する。
  const ogp = await strategy.run(url, env)

  return createNewArchiveContents({
    title: ogp.title,
    description: ogp.description,
    imageUrl: new URL(ogp.image),
    url,
  })
}
