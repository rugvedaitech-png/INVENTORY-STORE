#!/bin/bash
# Simple script to restore database from latest backup file

set -e

cd "$(dirname "$0")" || exit 1

MYSQL_USER="${MYSQL_USER:-inventory_user}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-inventory_password}"
MYSQL_DATABASE="${MYSQL_DATABASE:-inventory_store}"
BACKUP_FILE="backup_20251213_110926.sql"

echo "=========================================="
echo "Restore Database from Latest Backup"
echo "=========================================="
echo ""

echo "Step 1: Stopping application to prevent conflicts..."
docker-compose stop app || echo "App already stopped or not running"
echo "✅ Application stopped"
echo ""

echo "Step 2: Checking backup file..."
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
BACKUP_DATE=$(stat -c %y "$BACKUP_FILE" 2>/dev/null | cut -d' ' -f1 || stat -f "%Sm" -t "%Y-%m-%d" "$BACKUP_FILE" 2>/dev/null || echo "unknown")
echo "✅ Backup file found: $BACKUP_FILE"
echo "   Size: $BACKUP_SIZE"
echo "   Date: $BACKUP_DATE"
echo ""

echo "Step 3: Creating backup of current state (safety measure)..."
CURRENT_BACKUP="backup_current_before_restore_$(date +%Y%m%d_%H%M%S).sql"
if docker-compose exec -T mysql mysqldump -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" > "$CURRENT_BACKUP" 2>/dev/null; then
    CURRENT_SIZE=$(du -h "$CURRENT_BACKUP" | cut -f1)
    echo "✅ Current state backed up to: $CURRENT_BACKUP ($CURRENT_SIZE)"
else
    echo "⚠️  Warning: Could not create backup of current state (database might be empty)"
fi
echo ""

echo "Step 4: Restoring from backup: $BACKUP_FILE"
echo "   This will replace all current data with backup data..."
echo ""

# Wait for MySQL to be ready
echo "   Waiting for MySQL to be ready..."
sleep 2

# Restore the backup
if docker-compose exec -T mysql mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < "$BACKUP_FILE"; then
    echo "✅ Backup restored successfully!"
else
    echo "❌ Error: Failed to restore backup"
    echo "   Check MySQL logs: docker-compose logs mysql"
    exit 1
fi
echo ""

echo "Step 5: Verifying restoration..."
VERIFICATION=$(docker-compose exec -T mysql mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" -e "
SELECT 
    'User' as table_name, COUNT(*) as count FROM User
UNION ALL
SELECT 'Store', COUNT(*) FROM Store
UNION ALL
SELECT 'Product', COUNT(*) FROM Product
UNION ALL
SELECT 'Order', COUNT(*) FROM \`Order\`
UNION ALL
SELECT 'Customer', COUNT(*) FROM Customer
UNION ALL
SELECT 'Supplier', COUNT(*) FROM Supplier
UNION ALL
SELECT 'PurchaseOrder', COUNT(*) FROM PurchaseOrder;
" 2>/dev/null || echo "")

if [ -n "$VERIFICATION" ]; then
    echo "✅ Database contents after restoration:"
    echo "$VERIFICATION"
else
    echo "⚠️  Warning: Could not verify restoration (but it may have succeeded)"
fi
echo ""

echo "Step 6: Restarting application..."
docker-compose up -d app
echo "✅ Application restarted"
echo ""

echo "=========================================="
echo "Restoration Complete!"
echo "=========================================="
echo ""
echo "Database has been restored from: $BACKUP_FILE"
echo "Backup date: $BACKUP_DATE"
echo ""
echo "Next steps:"
echo "1. Check application logs: docker-compose logs -f app"
echo "2. Test login at: https://ordernestpro.rugvedaitech.com/auth/login"
echo "3. Verify your data is correct"
echo ""
if [ -f "$CURRENT_BACKUP" ]; then
    echo "📦 Previous state backed up to: $CURRENT_BACKUP"
    echo "   (Keep this file if you need to revert)"
fi
echo ""

