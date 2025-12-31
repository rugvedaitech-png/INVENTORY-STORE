#!/bin/bash

# Script to run tax fields migration on VPS
# Usage: ./run-tax-migration.sh

echo "Running tax fields migration..."

# Try to get MySQL credentials from environment or docker-compose
MYSQL_USER="${MYSQL_USER:-inventory_user}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-inventory_password}"
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
MIGRATION_SUCCESS=false
if docker ps | grep -q mysql; then
    MYSQL_CONTAINER=$(docker ps | grep mysql | awk '{print $1}' | head -n 1)
    if docker exec "$MYSQL_CONTAINER" mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" -e "DESCRIBE \`Order\`;" | grep -E "(taxRate|taxableAmount|taxAmount)" > /dev/null; then
        echo "✓ Migration successful! Tax fields found in Order table."
        MIGRATION_SUCCESS=true
    else
        echo "⚠ Migration may have failed. Please check manually."
    fi
elif command -v mysql &> /dev/null; then
    if mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" -e "DESCRIBE \`Order\`;" | grep -E "(taxRate|taxableAmount|taxAmount)" > /dev/null; then
        echo "✓ Migration successful! Tax fields found in Order table."
        MIGRATION_SUCCESS=true
    else
        echo "⚠ Migration may have failed. Please check manually."
    fi
else
    echo "⚠ Cannot verify migration - MySQL command not found."
fi

# Automatically restart application if migration was successful
if [ "$MIGRATION_SUCCESS" = true ]; then
    echo ""
    echo "Restarting application container..."
    
    # Try multiple restart methods
    if command -v docker-compose &> /dev/null; then
        docker-compose restart app && echo "✓ Application restarted using docker-compose" || {
            echo "⚠ docker-compose restart failed, trying docker restart..."
            docker restart inventory_app && echo "✓ Application restarted using docker restart" || echo "✗ Failed to restart application"
        }
    elif command -v docker &> /dev/null && docker compose version &> /dev/null 2>&1; then
        docker compose restart app && echo "✓ Application restarted using docker compose" || {
            echo "⚠ docker compose restart failed, trying docker restart..."
            docker restart inventory_app && echo "✓ Application restarted using docker restart" || echo "✗ Failed to restart application"
        }
    elif docker ps | grep -q inventory_app; then
        docker restart inventory_app && echo "✓ Application restarted using docker restart" || echo "✗ Failed to restart application"
    else
        echo "⚠ Application container 'inventory_app' not found. Please restart manually."
    fi
fi

