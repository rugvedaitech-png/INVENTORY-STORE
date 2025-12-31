#!/bin/bash

# Script to run tax fields migration on VPS
# Usage: ./run-tax-migration.sh

echo "Running tax fields migration..."

# Try to get MySQL credentials from environment or docker-compose
MYSQL_USER="${MYSQL_USER:-root}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-inventory_root_}"
MYSQL_DATABASE="${MYSQL_DATABASE:-inventory_store}"

# Check if MySQL is available
if command -v mysql &> /dev/null; then
    echo "MySQL command found. Running migration..."
    mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < run-tax-fields-migration.sql
    if [ $? -eq 0 ]; then
        echo "Migration completed successfully!"
    else
        echo "Migration failed. Please check credentials and try again."
        exit 1
    fi
elif docker ps | grep -q mysql; then
    echo "MySQL container found. Running migration via Docker..."
    MYSQL_CONTAINER=$(docker ps | grep mysql | awk '{print $1}' | head -n 1)
    if [ -z "$MYSQL_CONTAINER" ]; then
        echo "Error: Could not find MySQL container name."
        exit 1
    fi
    echo "Using MySQL container: $MYSQL_CONTAINER"
    docker exec -i "$MYSQL_CONTAINER" mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < run-tax-fields-migration.sql
    if [ $? -eq 0 ]; then
        echo "Migration completed successfully!"
    else
        echo "Migration failed. Please check credentials and try again."
        exit 1
    fi
else
    echo "Error: MySQL not found. Please run the migration manually."
    echo "See RUN_TAX_MIGRATION_ON_VPS.md for instructions."
    exit 1
fi

echo ""
echo "Verifying migration..."
if docker ps | grep -q mysql; then
    MYSQL_CONTAINER=$(docker ps | grep mysql | awk '{print $1}' | head -n 1)
    docker exec "$MYSQL_CONTAINER" mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" -e "DESCRIBE \`Order\`;" | grep -E "(taxRate|taxableAmount|taxAmount)" && echo "✓ Migration successful! Tax fields found in Order table." || echo "⚠ Migration may have failed. Please check manually."
elif command -v mysql &> /dev/null; then
    mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" -e "DESCRIBE \`Order\`;" | grep -E "(taxRate|taxableAmount|taxAmount)" && echo "✓ Migration successful! Tax fields found in Order table." || echo "⚠ Migration may have failed. Please check manually."
else
    echo "⚠ Cannot verify migration - MySQL command not found."
fi

