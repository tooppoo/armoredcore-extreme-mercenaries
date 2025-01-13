CREATE TABLE `archives` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`external_id` text NOT NULL,
	`url` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`image_url` text NOT NULL,
	`upload_member_id` integer NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`upload_member_id`) REFERENCES `discord_members`(`discord_user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `archives_external_id_unique` ON `archives` (`external_id`);--> statement-breakpoint
CREATE TABLE `delete_archive_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reason` text NOT NULL,
	`email_for_notice` text,
	`status_id` integer NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`status_id`) REFERENCES `delete_archive_requests_status`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `delete_archive_requests_status` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `deleted_archives` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`archive_url` text NOT NULL,
	`upload_member_id` integer NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`upload_member_id`) REFERENCES `discord_members`(`discord_user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `discord_members` (
	`discord_user_id` text PRIMARY KEY NOT NULL,
	`discord_user_name` text NOT NULL,
	`created_at` integer
);
