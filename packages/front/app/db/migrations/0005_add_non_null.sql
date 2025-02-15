PRAGMA foreign_keys=OFF;

-- discord_members の移行を最初に実施
CREATE TABLE `__new_discord_members` (
    `discord_user_id` text PRIMARY KEY NOT NULL,
    `discord_user_name` text NOT NULL,
    `created_at` integer NOT NULL
);
INSERT INTO `__new_discord_members`("discord_user_id", "discord_user_name", "created_at")
SELECT "discord_user_id", "discord_user_name", "created_at"
FROM `discord_members`;

DROP TABLE `discord_members`;
ALTER TABLE `__new_discord_members` RENAME TO `discord_members`;

-- challenge_archives
CREATE TABLE `__new_challenge_archives` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `external_id` text NOT NULL,
    `url` text,
    `title` text NOT NULL,
    `description` text NOT NULL,
    `upload_member_id` text NOT NULL,
    `created_at` integer NOT NULL,
    FOREIGN KEY (`upload_member_id`) REFERENCES `discord_members`(`discord_user_id`) ON UPDATE NO ACTION ON DELETE NO ACTION
);
INSERT INTO `__new_challenge_archives`("id", "external_id", "url", "title", "description", "upload_member_id", "created_at")
  SELECT "id", "external_id", "url", "title", "description", "upload_member_id", "created_at" FROM `challenge_archives`;
DROP TABLE `challenge_archives`;
ALTER TABLE `__new_challenge_archives` RENAME TO `challenge_archives`;
CREATE UNIQUE INDEX `challenge_archives_external_id_unique` ON `challenge_archives` (`external_id`);

-- video_archives
CREATE TABLE `__new_video_archives` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`external_id` text NOT NULL,
	`url` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`image_url` text NOT NULL,
	`upload_member_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`upload_member_id`) REFERENCES `discord_members`(`discord_user_id`) ON UPDATE no action ON DELETE no action
);
INSERT INTO `__new_video_archives`("id", "external_id", "url", "title", "description", "image_url", "upload_member_id", "created_at") SELECT "id", "external_id", "url", "title", "description", "image_url", "upload_member_id", "created_at" FROM `video_archives`;
DROP TABLE `video_archives`;
ALTER TABLE `__new_video_archives` RENAME TO `video_archives`;
CREATE UNIQUE INDEX `video_archives_external_id_unique` ON `video_archives` (`external_id`);

-- delete_archive_requests
CREATE TABLE `__new_delete_archive_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reason` text NOT NULL,
	`status_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`status_id`) REFERENCES `delete_archive_requests_status`(`id`) ON UPDATE no action ON DELETE no action
);
INSERT INTO `__new_delete_archive_requests`("id", "reason", "status_id", "created_at") SELECT "id", "reason", "status_id", "created_at" FROM `delete_archive_requests`;
DROP TABLE `delete_archive_requests`;
ALTER TABLE `__new_delete_archive_requests` RENAME TO `delete_archive_requests`;

-- deleted_archives
CREATE TABLE `__new_deleted_archives` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`original_url` text NOT NULL,
	`upload_member_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`upload_member_id`) REFERENCES `discord_members`(`discord_user_id`) ON UPDATE no action ON DELETE no action
);
INSERT INTO `__new_deleted_archives`("id", "original_url", "upload_member_id", "created_at") SELECT "id", "original_url", "upload_member_id", "created_at" FROM `deleted_archives`;
DROP TABLE `deleted_archives`;
ALTER TABLE `__new_deleted_archives` RENAME TO `deleted_archives`;

-- contents_revisions
CREATE TABLE `__new_contents_revisions` (
	`content_key` text PRIMARY KEY NOT NULL,
	`revision` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
INSERT INTO `__new_contents_revisions`("content_key", "revision", "created_at", "updated_at") SELECT "content_key", "revision", "created_at", "updated_at" FROM `contents_revisions`;
DROP TABLE `contents_revisions`;
ALTER TABLE `__new_contents_revisions` RENAME TO `contents_revisions`;

PRAGMA foreign_keys=ON;