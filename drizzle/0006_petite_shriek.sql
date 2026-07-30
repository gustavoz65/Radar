CREATE TABLE `installment_commitment` (
	`id` int AUTO_INCREMENT NOT NULL,
	`amount_remaining` decimal(15,2) NOT NULL,
	`installments_remaining` int NOT NULL,
	`purchases` int NOT NULL,
	`collected_at` datetime NOT NULL,
	CONSTRAINT `installment_commitment_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `bank_account` ADD `minimum_payment` decimal(15,2);--> statement-breakpoint
ALTER TABLE `bank_account` ADD `closing_day` int;--> statement-breakpoint
ALTER TABLE `bank_account` ADD `bill_is_official` boolean;