#!/bin/bash
# Script to sync database with VPS after currency migration
# Run this script on your VPS server

set -e

echo "=========================================="
echo "Database Sync Script for VPS"
echo "=========================================="

# Navigate to the project directory
cd apps/web || { echo "Error: apps/web directory not found."; exit 1; }

echo ""
echo "Step 1: Pulling latest code from repository..."
git pull origin main

echo ""
echo "Step 2: Installing/updating dependencies..."
npm install

echo ""
echo "Step 3: Regenerating Prisma client..."
npx prisma generate

echo ""
echo "Step 4: Checking database connection..."
npx prisma db pull

echo ""
echo "Step 5: Running database migrations..."
echo "This will apply the currency conversion and tax fields migrations."
npx prisma migrate deploy

echo ""
echo "Step 6: Verifying tax fields exist..."
mysql -u root -p -e "
USE your_database_name;
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
" || echo "Note: Please verify tax fields manually if MySQL command fails"

echo ""
echo "=========================================="
echo "Database sync completed!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Restart your application server"
echo "2. Verify prices are displaying correctly in rupees"
echo "3. Check that tax calculations are working"
echo ""

