-- Remove old costPaise and quotedCostPaise columns from PurchaseOrderItem table
-- These columns are no longer used after migration to Decimal cost/quotedCost

-- First, make the columns nullable (in case there's data)
ALTER TABLE `PurchaseOrderItem` 
  MODIFY COLUMN `costPaise` INT NULL,
  MODIFY COLUMN `quotedCostPaise` INT NULL;

-- Then drop the columns (they're no longer in the Prisma schema)
ALTER TABLE `PurchaseOrderItem` 
  DROP COLUMN `costPaise`,
  DROP COLUMN `quotedCostPaise`;

