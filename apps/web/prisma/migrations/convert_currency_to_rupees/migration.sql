-- Convert all currency fields from Int (paise) to Decimal (rupees)
-- This migration converts existing paise values to rupees by dividing by 100

-- Product table
ALTER TABLE `Product` 
  MODIFY COLUMN `price` DECIMAL(10,2) NOT NULL,
  MODIFY COLUMN `costPrice` DECIMAL(10,2) NULL;

-- Update existing data: convert paise to rupees
-- Using id > 0 to satisfy safe update mode
UPDATE `Product` SET `price` = `price` / 100 WHERE `id` > 0 AND `price` > 0;
UPDATE `Product` SET `costPrice` = `costPrice` / 100 WHERE `id` > 0 AND `costPrice` IS NOT NULL AND `costPrice` > 0;

-- Order table
ALTER TABLE `Order`
  MODIFY COLUMN `subtotal` DECIMAL(10,2) NOT NULL,
  MODIFY COLUMN `discountAmount` DECIMAL(10,2) NOT NULL DEFAULT 0,
  MODIFY COLUMN `totalAmount` DECIMAL(10,2) NOT NULL;

-- Update existing data: convert paise to rupees
-- Using id > 0 to satisfy safe update mode
UPDATE `Order` SET `subtotal` = `subtotal` / 100 WHERE `id` > 0 AND `subtotal` > 0;
UPDATE `Order` SET `discountAmount` = `discountAmount` / 100 WHERE `id` > 0 AND `discountAmount` > 0;
UPDATE `Order` SET `totalAmount` = `totalAmount` / 100 WHERE `id` > 0 AND `totalAmount` > 0;

-- OrderItem table
ALTER TABLE `OrderItem`
  MODIFY COLUMN `priceSnap` DECIMAL(10,2) NOT NULL;

-- Update existing data: convert paise to rupees
-- Using id > 0 to satisfy safe update mode
UPDATE `OrderItem` SET `priceSnap` = `priceSnap` / 100 WHERE `id` > 0 AND `priceSnap` > 0;

-- PurchaseOrder table
ALTER TABLE `PurchaseOrder`
  MODIFY COLUMN `subtotal` DECIMAL(10,2) NOT NULL DEFAULT 0,
  MODIFY COLUMN `taxTotal` DECIMAL(10,2) NOT NULL DEFAULT 0,
  MODIFY COLUMN `total` DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Update existing data: convert paise to rupees
-- Using id > 0 to satisfy safe update mode
UPDATE `PurchaseOrder` SET `subtotal` = `subtotal` / 100 WHERE `id` > 0 AND `subtotal` > 0;
UPDATE `PurchaseOrder` SET `taxTotal` = `taxTotal` / 100 WHERE `id` > 0 AND `taxTotal` > 0;
UPDATE `PurchaseOrder` SET `total` = `total` / 100 WHERE `id` > 0 AND `total` > 0;

-- PurchaseOrderItem table
-- Step 1: Rename columns first (preserves data, keeps INT type)
ALTER TABLE `PurchaseOrderItem`
  CHANGE COLUMN `costPaise` `cost` INT NOT NULL,
  CHANGE COLUMN `quotedCostPaise` `quotedCost` INT NULL;

-- Step 2: Convert the renamed columns to Decimal
ALTER TABLE `PurchaseOrderItem`
  MODIFY COLUMN `cost` DECIMAL(10,2) NOT NULL,
  MODIFY COLUMN `quotedCost` DECIMAL(10,2) NULL;

-- Step 3: Update existing data: convert paise to rupees
-- Using id > 0 to satisfy safe update mode
UPDATE `PurchaseOrderItem` SET `cost` = `cost` / 100 WHERE `id` > 0 AND `cost` > 0;
UPDATE `PurchaseOrderItem` SET `quotedCost` = `quotedCost` / 100 WHERE `id` > 0 AND `quotedCost` IS NOT NULL AND `quotedCost` > 0;

-- StockLedger table
ALTER TABLE `StockLedger`
  MODIFY COLUMN `unitCost` DECIMAL(10,2) NULL;

-- Update existing data: convert paise to rupees
-- Using id > 0 to satisfy safe update mode
UPDATE `StockLedger` SET `unitCost` = `unitCost` / 100 WHERE `id` > 0 AND `unitCost` IS NOT NULL AND `unitCost` > 0;

