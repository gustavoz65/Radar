CREATE TABLE `bank_account` (
	`id` int AUTO_INCREMENT NOT NULL,
	`external_id` varchar(128) NOT NULL,
	`provider_code` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('corrente','poupanca','investimento') NOT NULL,
	`balance` decimal(15,2) NOT NULL,
	`currency_code` varchar(8) NOT NULL DEFAULT 'BRL',
	`last_synced_at` datetime NOT NULL,
	CONSTRAINT `bank_account_id` PRIMARY KEY(`id`),
	CONSTRAINT `bank_account_external_id_idx` UNIQUE(`external_id`)
);
--> statement-breakpoint
CREATE TABLE `bank_transaction` (
	`id` int AUTO_INCREMENT NOT NULL,
	`account_id` int,
	`external_id` varchar(128) NOT NULL,
	`description` varchar(512) NOT NULL,
	`category` varchar(128),
	`amount` decimal(15,2) NOT NULL,
	`occurred_at` datetime NOT NULL,
	CONSTRAINT `bank_transaction_id` PRIMARY KEY(`id`),
	CONSTRAINT `bank_transaction_external_id_idx` UNIQUE(`external_id`)
);
--> statement-breakpoint
CREATE TABLE `investment_position` (
	`id` int AUTO_INCREMENT NOT NULL,
	`asset_class` enum('rendaFixa','cripto','acoes') NOT NULL,
	`name` varchar(255) NOT NULL,
	`ticker` varchar(32),
	`institution_code` varchar(64),
	`quantity` decimal(20,8) NOT NULL,
	`unit_value` decimal(15,2) NOT NULL,
	`invested_value` decimal(15,2) NOT NULL,
	`contracted_rate` varchar(128),
	`maturity_date` datetime,
	`purchased_at` datetime NOT NULL,
	`notes` text,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `investment_position_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `position_snapshot` (
	`id` int AUTO_INCREMENT NOT NULL,
	`position_id` int NOT NULL,
	`captured_at` datetime NOT NULL,
	`value` decimal(15,2) NOT NULL,
	CONSTRAINT `position_snapshot_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sync_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source` enum('pierre') NOT NULL,
	`status` enum('success','partial','error') NOT NULL,
	`started_at` datetime NOT NULL,
	`finished_at` datetime,
	`error` text,
	CONSTRAINT `sync_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `bank_transaction_occurred_at_idx` ON `bank_transaction` (`occurred_at`);--> statement-breakpoint
CREATE INDEX `position_snapshot_captured_at_idx` ON `position_snapshot` (`captured_at`);