-- Add address column to Store table (if it doesn't exist)
-- Run this SQL script in your MySQL database

-- Check and add address column
SET @dbname = DATABASE();
SET @tablename = 'Store';
SET @columnname = 'address';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1', -- Column exists, do nothing
  CONCAT('ALTER TABLE `', @tablename, '` ADD COLUMN `', @columnname, '` TEXT NULL COMMENT ''Store address to display on bills''')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

