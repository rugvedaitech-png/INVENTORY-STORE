-- AlterTable: Add billLayout column to Store table
ALTER TABLE `Store` ADD COLUMN `billLayout` ENUM('VERTICAL', 'REGULAR') NOT NULL DEFAULT 'REGULAR';

