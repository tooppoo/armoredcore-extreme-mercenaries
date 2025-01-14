/**
 * Archive機能のユースケースレベル処理を配置
 */

import { ArchiveContents } from '~/lib/archives/upload/entity.server'
import { getOGPFromURL, type GetOGPFromURL } from './ogp/ogp-from-url.server'
import { createNewArchiveContents } from '~/lib/archives/upload/factory.server'

/**
 * @throws {ArchiveError}
 */
export async function buildArchiveFromUrl(
  url: URL,
  getOGP: GetOGPFromURL = getOGPFromURL()
): Promise<ArchiveContents> {
  const ogp = await getOGP(url)

  return createNewArchiveContents({
    title: ogp.title,
    description: ogp.description,
    imageUrl: new URL(ogp.image),
    url,
  })
}
