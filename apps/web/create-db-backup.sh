#!/bin/bash
# Script to create a database backup before maintenance operations
# Usage: ./create-db-backup.sh [backup-name-prefix]

set -e

cd "$(dirname "$0")" || exit 1

MYSQL_USER="${MYSQL_USER:-inventory_user}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-inventory_password}"
MYSQL_DATABASE="${MYSQL_DATABASE:-inventory_store}"

# Backup name prefix (optional, defaults to "backup")
BACKUP_PREFIX="${1:-backup}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_PREFIX}_${TIMESTAMP}.sql"
BACKUP_DIR="."

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "=========================================="
echo "Creating Database Backup"
echo "=========================================="
echo ""

echo "Step 1: Checking MySQL container..."
if ! docker-compose ps mysql | grep -q "Up"; then
    echo "❌ Error: MySQL container is not running"
    exit 1
fi
echo "✅ MySQL container is running"
echo ""

echo "Step 2: Creating backup: $BACKUP_FILE"
echo "   Database: $MYSQL_DATABASE"
echo "   User: $MYSQL_USER"
echo ""

# Create the backup
if docker-compose exec -T mysql mysqldump \
    -u"$MYSQL_USER" \
    -p"$MYSQL_PASSWORD" \
    --single-transaction \
    --routines \
    --triggers \
    "$MYSQL_DATABASE" > "$BACKUP_FILE" 2>/dev/null; then
    
    # Check if backup file was created and has content
    if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        echo "✅ Backup created successfully!"
        echo "   File: $BACKUP_FILE"
        echo "   Size: $BACKUP_SIZE"
        echo ""
        
        # Verify backup contains data
        TABLE_COUNT=$(grep -c "CREATE TABLE" "$BACKUP_FILE" || echo "0")
        if [ "$TABLE_COUNT" -gt "0" ]; then
            echo "✅ Backup verification: Found $TABLE_COUNT tables"
        else
            echo "⚠️  Warning: Backup file may be empty or corrupted"
        fi
    else
        echo "❌ Error: Backup file was not created or is empty"
        exit 1
    fi
else
    echo "❌ Error: Failed to create backup"
    exit 1
fi

echo ""
echo "=========================================="
echo "Backup Complete!"
echo "=========================================="
echo ""
echo "Backup saved to: $BACKUP_FILE"
echo "Size: $BACKUP_SIZE"
echo ""
echo "To restore this backup later:"
echo "  docker-compose exec -T mysql mysql -u$MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE < $BACKUP_FILE"
echo ""

