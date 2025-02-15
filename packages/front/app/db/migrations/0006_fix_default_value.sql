PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_challenge_archives` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`external_id` text NOT NULL,
	`url` text,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`upload_member_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`upload_member_id`) REFERENCES `discord_members`(`discord_user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_challenge_archives`("id", "external_id", "url", "title", "description", "upload_member_id", "created_at") SELECT "id", "external_id", "url", "title", "description", "upload_member_id", "created_at" FROM `challenge_archives`;--> statement-breakpoint
DROP TABLE `challenge_archives`;--> statement-breakpoint
ALTER TABLE `__new_challenge_archives` RENAME TO `challenge_archives`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `challenge_archives_external_id_unique` ON `challenge_archives` (`external_id`);--> statement-breakpoint
CREATE TABLE `__new_contents_revisions` (
	`content_key` text PRIMARY KEY NOT NULL,
	`revision` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_contents_revisions`("content_key", "revision", "created_at", "updated_at") SELECT "content_key", "revision", "created_at", "updated_at" FROM `contents_revisions`;--> statement-breakpoint
DROP TABLE `contents_revisions`;--> statement-breakpoint
ALTER TABLE `__new_contents_revisions` RENAME TO `contents_revisions`;--> statement-breakpoint
CREATE TABLE `__new_delete_archive_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reason` text NOT NULL,
	`status_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`status_id`) REFERENCES `delete_archive_requests_status`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_delete_archive_requests`("id", "reason", "status_id", "created_at") SELECT "id", "reason", "status_id", "created_at" FROM `delete_archive_requests`;--> statement-breakpoint
DROP TABLE `delete_archive_requests`;--> statement-breakpoint
ALTER TABLE `__new_delete_archive_requests` RENAME TO `delete_archive_requests`;--> statement-breakpoint
CREATE TABLE `__new_deleted_archives` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`original_url` text NOT NULL,
	`upload_member_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`upload_member_id`) REFERENCES `discord_members`(`discord_user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_deleted_archives`("id", "original_url", "upload_member_id", "created_at") SELECT "id", "original_url", "upload_member_id", "created_at" FROM `deleted_archives`;--> statement-breakpoint
DROP TABLE `deleted_archives`;--> statement-breakpoint
ALTER TABLE `__new_deleted_archives` RENAME TO `deleted_archives`;--> statement-breakpoint
CREATE TABLE `__new_discord_members` (
	`discord_user_id` text PRIMARY KEY NOT NULL,
	`discord_user_name` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_discord_members`("discord_user_id", "discord_user_name", "created_at") SELECT "discord_user_id", "discord_user_name", "created_at" FROM `discord_members`;--> statement-breakpoint
DROP TABLE `discord_members`;--> statement-breakpoint
ALTER TABLE `__new_discord_members` RENAME TO `discord_members`;--> statement-breakpoint
CREATE TABLE `__new_video_archives` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`external_id` text NOT NULL,
	`url` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`image_url` text NOT NULL,
	`upload_member_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`upload_member_id`) REFERENCES `discord_members`(`discord_user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_video_archives`("id", "external_id", "url", "title", "description", "image_url", "upload_member_id", "created_at") SELECT "id", "external_id", "url", "title", "description", "image_url", "upload_member_id", "created_at" FROM `video_archives`;--> statement-breakpoint
DROP TABLE `video_archives`;--> statement-breakpoint
ALTER TABLE `__new_video_archives` RENAME TO `video_archives`;--> statement-breakpoint
CREATE UNIQUE INDEX `video_archives_external_id_unique` ON `video_archives` (`external_id`);