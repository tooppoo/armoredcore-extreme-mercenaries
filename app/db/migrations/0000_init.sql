CREATE TABLE `archives` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`external_id` text NOT NULL,
	`url` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`image_url` text NOT NULL,
	`upload_user_id` integer NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`upload_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `archives_external_id_unique` ON `archives` (`external_id`);--> statement-breakpoint
CREATE TABLE `auth_discord` (
	`user_id` integer PRIMARY KEY NOT NULL,
	`discord_user_id` text NOT NULL,
	`discord_user_discriminator` text NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_discord_discord_user_id_unique` ON `auth_discord` (`discord_user_id`);--> statement-breakpoint
CREATE TABLE `delete_archive_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`archive_external_id` text NOT NULL,
	`reason` text NOT NULL,
	`email_for_notice` text,
	`status` text DEFAULT 'pending',
	`created_at` integer,
	FOREIGN KEY (`archive_external_id`) REFERENCES `archives`(`external_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `deleted_archives` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`archive_url` text NOT NULL,
	`upload_user_id` integer NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`upload_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer
);
