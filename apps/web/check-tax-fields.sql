-- Check if tax fields exist in Order table
-- Run this to verify the columns exist

SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'Order'
  AND COLUMN_NAME IN ('taxRate', 'taxableAmount', 'taxAmount')
ORDER BY COLUMN_NAME;

