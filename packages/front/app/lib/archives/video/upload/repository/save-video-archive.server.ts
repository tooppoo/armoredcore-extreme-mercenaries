/**
 * DBとの直接のやり取りを定義
 */

import { Database } from '~/db/driver.server'
import { videoArchives, discordMembers } from '~/db/schema.server'
import { Archive } from '~/lib/archives/video/upload/entity.server'
import { normalizeUrlForStorage } from '~/lib/archives/common/url/support-url.server'
import { updateVideoArchiveListRevision } from '~/lib/archives/video/revision/repository'

export const saveVideoArchive = async (
  entity: Archive,
  db: Database,
): Promise<void> => {
  // D1でトランザクションが使えないのでworkaround
  // https://leaysgur.github.io/posts/2023/10/17/213948/
  await db.batch([
    db
      .insert(discordMembers)
      .values({
        discordUserId: entity.uploader.id,
        discordUserName: entity.uploader.name,
      })
      .onConflictDoNothing({ target: discordMembers.discordUserId }),
    db.insert(videoArchives).values({
      url: normalizeUrlForStorage(entity.contents.url).toString(),
      title: entity.contents.title,
      description: entity.contents.description,
      imageUrl: entity.contents.imageUrl.toString(),
      uploadMemberId: entity.uploader.id,
    }),
    updateVideoArchiveListRevision(db),
  ])
}
