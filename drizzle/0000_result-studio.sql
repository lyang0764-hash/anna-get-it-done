CREATE TABLE `app_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`encrypted_api_key` text,
	`model` text DEFAULT 'gpt-5.6' NOT NULL,
	`official_qr_data` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`prompt` text NOT NULL,
	`category` text NOT NULL,
	`title` text NOT NULL,
	`report_json` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
