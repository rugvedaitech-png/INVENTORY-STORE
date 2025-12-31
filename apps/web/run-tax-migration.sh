#!/bin/bash

# Script to run tax fields migration on VPS
# Usage: ./run-tax-migration.sh

echo "Running tax fields migration..."

# Check if MySQL is available
if command -v mysql &> /dev/null; then
    echo "MySQL command found. Running migration..."
    mysql -u inventory_user -pinventory_root_password inventory_store < run-tax-fields-migration.sql
    echo "Migration completed!"
elif docker ps | grep -q mysql; then
    echo "MySQL container found. Running migration via Docker..."
    MYSQL_CONTAINER=$(docker ps | grep mysql | awk '{print $1}' | head -n 1)
    docker exec -i $MYSQL_CONTAINER mysql -u inventory_user -pinventory_root_password inventory_store < run-tax-fields-migration.sql
    echo "Migration completed!"
else
    echo "Error: MySQL not found. Please run the migration manually."
    echo "See RUN_TAX_MIGRATION_ON_VPS.md for instructions."
    exit 1
fi

echo ""
echo "Verifying migration..."
mysql -u inventory_user -pinventory_root_password inventory_store -e "DESCRIBE \`Order\`;" | grep -E "(taxRate|taxableAmount|taxAmount)" && echo "✓ Migration successful!" || echo "⚠ Migration may have failed. Please check manually."

