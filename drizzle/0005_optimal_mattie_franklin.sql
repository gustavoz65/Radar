CREATE TABLE `confidence_signal_factor` (
	`id` int AUTO_INCREMENT NOT NULL,
	`signal_id` int NOT NULL,
	`label` varchar(255) NOT NULL,
	`direction` enum('positive','negative','neutral') NOT NULL,
	`weight` int NOT NULL,
	`position` int NOT NULL,
	CONSTRAINT `confidence_signal_factor_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `confidence_signal` (
	`id` int AUTO_INCREMENT NOT NULL,
	`position_id` int NOT NULL,
	`asset_class` enum('rendaFixa','cripto','acoes') NOT NULL,
	`score` int NOT NULL,
	`formula_version` varchar(32) NOT NULL,
	`title` varchar(255) NOT NULL,
	`summary` text NOT NULL,
	`disclaimer` varchar(255) NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `confidence_signal_id` PRIMARY KEY(`id`),
	CONSTRAINT `signal_position_idx` UNIQUE(`position_id`)
);
--> statement-breakpoint
CREATE INDEX `signal_factor_signal_idx` ON `confidence_signal_factor` (`signal_id`);