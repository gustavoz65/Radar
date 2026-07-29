CREATE TABLE `economic_indicator` (
	`id` int AUTO_INCREMENT NOT NULL,
	`series` enum('selic','cdi','ipca12m','poupanca') NOT NULL,
	`value` decimal(10,4) NOT NULL,
	`reference_date` datetime NOT NULL,
	`collected_at` datetime NOT NULL,
	CONSTRAINT `economic_indicator_id` PRIMARY KEY(`id`),
	CONSTRAINT `economic_indicator_series_date_idx` UNIQUE(`series`,`reference_date`)
);
--> statement-breakpoint
CREATE TABLE `market_price` (
	`id` int AUTO_INCREMENT NOT NULL,
	`asset_class` enum('cripto','acoes') NOT NULL,
	`ticker` varchar(32) NOT NULL,
	`price_brl` decimal(20,8) NOT NULL,
	`change_percent` decimal(10,4),
	`collected_at` datetime NOT NULL,
	CONSTRAINT `market_price_id` PRIMARY KEY(`id`),
	CONSTRAINT `market_price_ticker_collected_idx` UNIQUE(`ticker`,`collected_at`)
);
--> statement-breakpoint
CREATE TABLE `news_item` (
	`id` int AUTO_INCREMENT NOT NULL,
	`external_id` varchar(512) NOT NULL,
	`title` varchar(512) NOT NULL,
	`source` varchar(128) NOT NULL,
	`url` varchar(512) NOT NULL,
	`published_at` datetime NOT NULL,
	`category` enum('selic','cripto','acoes','bancos') NOT NULL,
	`summary` text,
	CONSTRAINT `news_item_id` PRIMARY KEY(`id`),
	CONSTRAINT `news_item_external_id_idx` UNIQUE(`external_id`)
);
--> statement-breakpoint
CREATE INDEX `market_price_class_idx` ON `market_price` (`asset_class`);--> statement-breakpoint
CREATE INDEX `news_item_published_idx` ON `news_item` (`published_at`);