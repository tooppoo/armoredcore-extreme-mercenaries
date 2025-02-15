CREATE TABLE `contents_revisions` (
	`content_key` text PRIMARY KEY NOT NULL,
	`revision` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
