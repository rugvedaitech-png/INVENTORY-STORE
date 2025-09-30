-- Customer Addresses Migration SQL
-- Execute these queries manually in your MySQL database

-- Step 1: Create CustomerAddress table
CREATE TABLE `CustomerAddress` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `customerId` INT NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `fullName` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(191) NOT NULL,
  `address` TEXT NOT NULL,
  `city` VARCHAR(191) NOT NULL,
  `state` VARCHAR(191) NOT NULL,
  `pincode` VARCHAR(191) NOT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `CustomerAddress_customerId_isActive_idx` (`customerId`, `isActive`),
  CONSTRAINT `CustomerAddress_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Step 2: Add addressId column to Order table
ALTER TABLE `Order` ADD COLUMN `addressId` INT NULL;

-- Step 3: Add foreign key constraint for addressId
ALTER TABLE `Order` ADD CONSTRAINT `Order_addressId_fkey` FOREIGN KEY (`addressId`) REFERENCES `CustomerAddress` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 4: Migrate existing customer addresses to CustomerAddress table
-- This will create one address record for each customer with existing address data
INSERT INTO `CustomerAddress` (`customerId`, `title`, `fullName`, `phone`, `address`, `city`, `state`, `pincode`, `isActive`)
SELECT 
  c.`id` as `customerId`,
  'Primary Address' as `title`,
  c.`name` as `fullName`,
  c.`phone` as `phone`,
  COALESCE(c.`address`, 'Address not provided') as `address`,
  'City' as `city`, -- Default value, you may want to parse from address
  'State' as `state`, -- Default value, you may want to parse from address  
  '000000' as `pincode`, -- Default value, you may want to parse from address
  true as `isActive`
FROM `Customer` c
WHERE c.`address` IS NOT NULL AND c.`address` != '';

-- Step 5: Update existing orders to reference the new address records
-- This links orders to the customer's primary address
UPDATE `Order` o
JOIN `Customer` c ON (o.`customerId` = c.`userId` OR o.`phone` = c.`phone`)
JOIN `CustomerAddress` ca ON ca.`customerId` = c.`id` AND ca.`isActive` = true
SET o.`addressId` = ca.`id`
WHERE o.`addressId` IS NULL;

-- Step 6: Verify the migration
-- Check that addresses were created correctly
SELECT 
  c.id as customer_id,
  c.name as customer_name,
  ca.id as address_id,
  ca.title,
  ca.isActive,
  ca.address
FROM Customer c
LEFT JOIN CustomerAddress ca ON ca.customerId = c.id
ORDER BY c.id, ca.isActive DESC;

-- Check that orders are linked to addresses
SELECT 
  o.id as order_id,
  o.buyerName,
  o.address as old_address,
  o.addressId,
  ca.address as new_address,
  ca.title as address_title
FROM `Order` o
LEFT JOIN CustomerAddress ca ON ca.id = o.addressId
LIMIT 10;

-- Step 7: (Optional) After verifying migration is successful, you can remove old columns
-- ALTER TABLE `Customer` DROP COLUMN `address`;
-- ALTER TABLE `Order` DROP COLUMN `address`;
-- ALTER TABLE `Order` DROP COLUMN `buyerName`;  
-- ALTER TABLE `Order` DROP COLUMN `phone`;

-- Note: Keep the deprecated columns for now until full migration is verified
