CREATE TABLE `generation_jobs` (
	`root_id` text PRIMARY KEY NOT NULL,
	`active_response_id` text NOT NULL,
	`prompt` text NOT NULL,
	`model` text NOT NULL,
	`continuation_count` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
