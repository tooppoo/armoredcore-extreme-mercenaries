ALTER TABLE `deleted_archives` RENAME COLUMN "archive_url" TO "original_url";--> statement-breakpoint
CREATE TABLE `challenge_archives` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`external_id` text NOT NULL,
	`url` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`upload_member_id` text NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`upload_member_id`) REFERENCES `discord_members`(`discord_user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `challenge_archives_external_id_unique` ON `challenge_archives` (`external_id`);--> statement-breakpoint
CREATE TABLE `delete_archive_request_challenge_relations` (
	`delete_request_id` integer NOT NULL,
	`challenge_archive_id` integer NOT NULL,
	PRIMARY KEY(`delete_request_id`, `challenge_archive_id`),
	FOREIGN KEY (`delete_request_id`) REFERENCES `delete_archive_requests`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`challenge_archive_id`) REFERENCES `challenge_archives`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `delete_archive_request_video_relations` (
	`delete_request_id` integer NOT NULL,
	`video_archive_id` integer NOT NULL,
	PRIMARY KEY(`delete_request_id`, `video_archive_id`),
	FOREIGN KEY (`delete_request_id`) REFERENCES `delete_archive_requests`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`video_archive_id`) REFERENCES `video_archives`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `delete_archive_requests` DROP COLUMN `email_for_notice`;