-- Add cost column to PurchaseOrderItem table if it doesn't exist
-- This migration ensures the cost column exists for purchase order items

-- Check if cost column exists, if not add it
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'PurchaseOrderItem'
  AND COLUMN_NAME = 'cost';

-- Add cost column if it doesn't exist
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `PurchaseOrderItem` ADD COLUMN `cost` DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT ''Store owner''''s estimated cost (rupees)''',
  'SELECT ''Column cost already exists in PurchaseOrderItem'' AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if quotedCost column exists, if not add it
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'PurchaseOrderItem'
  AND COLUMN_NAME = 'quotedCost';

-- Add quotedCost column if it doesn't exist
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `PurchaseOrderItem` ADD COLUMN `quotedCost` DECIMAL(10,2) NULL COMMENT ''Supplier''''s quoted cost (rupees)''',
  'SELECT ''Column quotedCost already exists in PurchaseOrderItem'' AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

