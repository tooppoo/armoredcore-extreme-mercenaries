import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'

export const discordMembers = sqliteTable('discord_members', {
  discordUserId: text('discord_user_id').primaryKey(),
  discordUserName: text('discord_user_name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$default(() => sql`CURRENT_TIMESTAMP`),
})

export const videoArchives = sqliteTable('video_archives', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  externalId: text('external_id')
    .unique()
    .notNull()
    .$default(() => uuidv7()),
  url: text('url').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  imageUrl: text('image_url').notNull(),
  uploadMemberId: text('upload_member_id')
    .notNull()
    .references(() => discordMembers.discordUserId),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$default(() => sql`CURRENT_TIMESTAMP`),
})

export const challengeArchives = sqliteTable('challenge_archives', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  externalId: text('external_id')
    .unique()
    .notNull()
    .$default(() => uuidv7()),
  url: text('url'),
  title: text('title').notNull(),
  description: text('description').notNull(),
  uploadMemberId: text('upload_member_id')
    .notNull()
    .references(() => discordMembers.discordUserId),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$default(() => sql`CURRENT_TIMESTAMP`),
})

export const deleteArchiveRequests = sqliteTable('delete_archive_requests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reason: text('reason').notNull(),
  statusId: integer('status_id')
    .notNull()
    .references(() => deleteArchiveRequestsStatus.id),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$default(() => sql`CURRENT_TIMESTAMP`),
})

export const deleteArchiveRequestsStatus = sqliteTable(
  'delete_archive_requests_status',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    value: text('value').notNull(),
  },
)

export const deleteArchiveRequestVideoRelations = sqliteTable(
  'delete_archive_request_video_relations',
  {
    deleteRequestId: integer('delete_request_id')
      .notNull()
      .references(() => deleteArchiveRequests.id), // 外部キー
    videoArchiveId: integer('video_archive_id')
      .notNull()
      .references(() => videoArchives.id), // 外部キー
  },
  (table) => [
    primaryKey({ columns: [table.deleteRequestId, table.videoArchiveId] }),
  ],
)

export const deleteArchiveRequestChallengeRelations = sqliteTable(
  'delete_archive_request_challenge_relations',
  {
    deleteRequestId: integer('delete_request_id')
      .notNull()
      .references(() => deleteArchiveRequests.id), // 外部キー
    challengeArchiveId: integer('challenge_archive_id')
      .notNull()
      .references(() => challengeArchives.id), // 外部キー
  },
  (table) => [
    primaryKey({ columns: [table.deleteRequestId, table.challengeArchiveId] }),
  ],
)

export const deletedArchives = sqliteTable('deleted_archives', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  Url: text('original_url').notNull(),
  uploadMemberId: integer('upload_member_id')
    .notNull()
    .references(() => discordMembers.discordUserId),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$default(() => sql`CURRENT_TIMESTAMP`),
})

export const contentsRevisions = sqliteTable('contents_revisions', {
  contentKey: text('content_key').primaryKey(),
  revision: integer('revision').notNull().$default(() => 1),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$default(() => sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$default(() => sql`CURRENT_TIMESTAMP`),
})
