PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_challenge_archives` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`external_id` text NOT NULL,
	`url` text,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`upload_member_id` text NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`upload_member_id`) REFERENCES `discord_members`(`discord_user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_challenge_archives`("id", "external_id", "url", "title", "description", "upload_member_id", "created_at") SELECT "id", "external_id", "url", "title", "description", "upload_member_id", "created_at" FROM `challenge_archives`;--> statement-breakpoint
DROP TABLE `challenge_archives`;--> statement-breakpoint
ALTER TABLE `__new_challenge_archives` RENAME TO `challenge_archives`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `challenge_archives_external_id_unique` ON `challenge_archives` (`external_id`);