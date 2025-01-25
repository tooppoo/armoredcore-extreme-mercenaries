import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid'

export const discordMembers = sqliteTable('discord_members', {
  discordUserId: text('discord_user_id').primaryKey(),
  discordUserName: text('discord_user_name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$default(() => sql`CURRENT_TIMESTAMP`),
});

export const videoArchives = sqliteTable('video_archives', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  externalId: text('external_id').unique().notNull().$default(() => uuidv7()),
  url: text('url').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  imageUrl: text('image_url').notNull(),
  uploadMemberId: text('upload_member_id').notNull().references(() => discordMembers.discordUserId),
  createdAt: integer('created_at', { mode: 'timestamp' }).$default(() => sql`CURRENT_TIMESTAMP`),
});

export const deleteArchiveRequests = sqliteTable('delete_archive_requests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reason: text('reason').notNull(),
  emailForNotice: text('email_for_notice'),
  statusId: integer('status_id').notNull().references(() => deleteArchiveRequestsStatus.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).$default(() => sql`CURRENT_TIMESTAMP`),
});
export const deleteArchiveRequestsStatus = sqliteTable('delete_archive_requests_status', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  value: text('value').notNull(),
})

export const deletedArchives = sqliteTable('deleted_archives', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  archiveUrl: text('archive_url').notNull(),
  uploadMemberId: integer('upload_member_id').notNull().references(() => discordMembers.discordUserId),
  createdAt: integer('created_at', { mode: 'timestamp' }).$default(() => sql`CURRENT_TIMESTAMP`),
});
