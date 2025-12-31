-- Add tax fields to Order table
ALTER TABLE `Order`
  ADD COLUMN `taxRate` DECIMAL(5,2) NULL COMMENT 'Tax rate percentage (e.g., 18.00 for 18%)',
  ADD COLUMN `taxableAmount` DECIMAL(10,2) NULL COMMENT 'Taxable amount (before tax) in rupees',
  ADD COLUMN `taxAmount` DECIMAL(10,2) NULL COMMENT 'Tax amount in rupees';

