ALTER TABLE `bank_account` ADD `credit_limit` decimal(15,2);--> statement-breakpoint
ALTER TABLE `bank_account` ADD `available_credit_limit` decimal(15,2);--> statement-breakpoint
ALTER TABLE `bank_account` ADD `balance_due_date` datetime;--> statement-breakpoint
ALTER TABLE `investment_position` ADD `source` enum('manual','pierre') DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE `investment_position` ADD `external_id` varchar(191);--> statement-breakpoint
ALTER TABLE `investment_position` ADD CONSTRAINT `investment_position_external_id_idx` UNIQUE(`external_id`);