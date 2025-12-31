-- Step 1: Rename columns first (preserves data)
ALTER TABLE `PurchaseOrderItem`
  CHANGE COLUMN `costPaise` `cost` INT NOT NULL,
  CHANGE COLUMN `quotedCostPaise` `quotedCost` INT NULL;

-- Step 2: Now convert the renamed columns to Decimal
ALTER TABLE `PurchaseOrderItem`
  MODIFY COLUMN `cost` DECIMAL(10,2) NOT NULL,
  MODIFY COLUMN `quotedCost` DECIMAL(10,2) NULL;

-- Step 3: Convert existing data from paise to rupees
UPDATE `PurchaseOrderItem` SET `cost` = `cost` / 100 WHERE `id` > 0 AND `cost` > 0;
UPDATE `PurchaseOrderItem` SET `quotedCost` = `quotedCost` / 100 WHERE `id` > 0 AND `quotedCost` IS NOT NULL AND `quotedCost` > 0;

