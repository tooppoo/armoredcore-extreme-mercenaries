import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid'

export const discordMembers = sqliteTable('discord_members', {
  discordUserId: text('discord_user_id').primaryKey(),
  discordUserDiscriminator: text('discord_user_discriminator').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$default(() => sql`CURRENT_TIMESTAMP`),
});

export const archives = sqliteTable('archives', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  externalId: text('external_id').unique().notNull().$default(() => uuidv7()),
  url: text('url').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  imageUrl: text('image_url').notNull(),
  uploadMemberId: integer('upload_member_id').notNull().references(() => discordMembers.discordUserId),
  createdAt: integer('created_at', { mode: 'timestamp' }).$default(() => sql`CURRENT_TIMESTAMP`),
});

export const deleteArchiveRequests = sqliteTable('delete_archive_requests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  archiveExternalId: text('archive_external_id').notNull().references(() => archives.externalId),
  reason: text('reason').notNull(),
  emailForNotice: text('email_for_notice'),
  status: text('status', { enum: ['pending', 'approved', 'rejected'] }).default('pending'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$default(() => sql`CURRENT_TIMESTAMP`),
});

export const deletedArchives = sqliteTable('deleted_archives', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  archiveUrl: text('archive_url').notNull(),
  uploadMemberId: integer('upload_member_id').notNull().references(() => discordMembers.discordUserId),
  createdAt: integer('created_at', { mode: 'timestamp' }).$default(() => sql`CURRENT_TIMESTAMP`),
});
