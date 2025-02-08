/**
 * DBとの直接のやり取りを定義
 */

import { Database } from '~/db/driver.server';
import { discordMembers, challengeArchives } from '~/db/schema.server';
import { Archive } from '~/lib/archives/challenge/upload/entity.server';
import { normalizeUrl } from '~/lib/archives/common/url/support-url.server'

export const saveChallengeArchive = async (entity: Archive, db: Database): Promise<void> => {
  // D1でトランザクションが使えないのでworkaround
  // https://leaysgur.github.io/posts/2023/10/17/213948/
  await db.batch([
    db
      .insert(discordMembers)
      .values({ discordUserId: entity.uploader.id, discordUserName: entity.uploader.name })
      .onConflictDoNothing({ target: discordMembers.discordUserId }),
    db
      .insert(challengeArchives)
      .values({
        url: entity.contents.url ? normalizeUrl(entity.contents.url).toString() : null,
        title: entity.contents.title,
        description: entity.contents.description,
        uploadMemberId: entity.uploader.id,
      })   
  ])
}
