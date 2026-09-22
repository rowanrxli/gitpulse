CREATE TABLE `job_locks` (
	`name` text PRIMARY KEY NOT NULL,
	`until` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `repositories` (
	`id` integer PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`payload` text NOT NULL,
	`fetched_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `repo_snapshots` (
	`repo_id` integer NOT NULL,
	`recorded_at` integer NOT NULL,
	`stars` integer NOT NULL,
	`forks` integer NOT NULL,
	PRIMARY KEY(`repo_id`, `recorded_at`),
	FOREIGN KEY (`repo_id`) REFERENCES `repositories`(`id`) ON UPDATE no action ON DELETE no action
);
