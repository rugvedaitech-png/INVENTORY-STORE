#!/bin/bash

# Script to run store address migration on VPS
# Usage: ./run-store-address-migration.sh

echo "Running store address migration..."

# Try to get MySQL credentials from environment or docker-compose
MYSQL_USER="${MYSQL_USER:-inventory_user}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-inventory_password}"
MYSQL_DATABASE="${MYSQL_DATABASE:-inventory_store}"

# Check if MySQL is available
if command -v mysql &> /dev/null; then
    echo "MySQL command found. Running migration..."
    mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < add-store-address-migration.sql
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
    docker exec -i "$MYSQL_CONTAINER" mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < add-store-address-migration.sql
    if [ $? -eq 0 ]; then
        echo "Migration completed successfully!"
    else
        echo "Migration failed. Please check credentials and try again."
        exit 1
    fi
else
    echo "Error: MySQL not found. Please run the migration manually."
    echo "See add-store-address-migration.sql for instructions."
    exit 1
fi

echo ""
echo "Verifying migration..."
if docker ps | grep -q mysql; then
    MYSQL_CONTAINER=$(docker ps | grep mysql | awk '{print $1}' | head -n 1)
    docker exec "$MYSQL_CONTAINER" mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" -e "DESCRIBE \`Store\`;" | grep -E "address" && echo "✓ Migration successful! Address column found in Store table." || echo "⚠ Migration may have failed. Please check manually."
elif command -v mysql &> /dev/null; then
    mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" -e "DESCRIBE \`Store\`;" | grep -E "address" && echo "✓ Migration successful! Address column found in Store table." || echo "⚠ Migration may have failed. Please check manually."
else
    echo "⚠ Cannot verify migration - MySQL command not found."
fi

