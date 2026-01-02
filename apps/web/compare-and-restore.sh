#!/bin/bash
# Script to compare current database with backup and restore if needed

set -e

cd "$(dirname "$0")" || exit 1

MYSQL_USER="${MYSQL_USER:-inventory_user}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-inventory_password}"
MYSQL_DATABASE="${MYSQL_DATABASE:-inventory_store}"
BACKUP_FILE="backup_20251213_110926.sql"

echo "=========================================="
echo "Database Comparison and Restoration"
echo "=========================================="
echo ""

echo "Step 1: Checking CURRENT database state..."
echo "----------------------------------------"
CURRENT_DATA=$(docker-compose exec -T mysql mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" -e "
SELECT 
    'User' as table_name, 
    COUNT(*) as count,
    MAX(createdAt) as latest_record
FROM User
UNION ALL
SELECT 'Store', COUNT(*), MAX(createdAt) FROM Store
UNION ALL
SELECT 'Product', COUNT(*), MAX(createdAt) FROM Product
UNION ALL
SELECT 'Order', COUNT(*), MAX(createdAt) FROM \`Order\`
UNION ALL
SELECT 'Customer', COUNT(*), MAX(createdAt) FROM Customer
UNION ALL
SELECT 'Supplier', COUNT(*), MAX(createdAt) FROM Supplier
UNION ALL
SELECT 'PurchaseOrder', COUNT(*), MAX(createdAt) FROM PurchaseOrder;
" 2>/dev/null || echo "")

if [ -n "$CURRENT_DATA" ]; then
    echo "Current database contents:"
    echo "$CURRENT_DATA"
    echo ""
    
    # Extract latest record date
    LATEST_DATE=$(echo "$CURRENT_DATA" | grep -oP '\d{4}-\d{2}-\d{2}' | sort -r | head -1 || echo "")
    if [ -n "$LATEST_DATE" ]; then
        echo "Latest record in current database: $LATEST_DATE"
        BACKUP_DATE="2025-12-13"
        echo "Backup file date: $BACKUP_DATE"
        echo ""
        
        if [[ "$LATEST_DATE" > "$BACKUP_DATE" ]]; then
            echo "⚠️  WARNING: Current database has data NEWER than backup!"
            echo "   Current data is from: $LATEST_DATE"
            echo "   Backup is from: $BACKUP_DATE"
            echo ""
            echo "   Options:"
            echo "   1. Keep current data and just initialize missing tables (RECOMMENDED)"
            echo "   2. Restore from backup (will lose data after Dec 13)"
            echo ""
            read -p "Choose option (1 or 2): " -n 1 -r
            echo
            if [[ $REPLY == "1" ]]; then
                echo ""
                echo "Step 2: Initializing missing tables only (preserving current data)..."
                docker-compose exec -T app npx prisma db push --skip-generate --accept-data-loss=false 2>&1 || {
                    echo "⚠️  db push failed. Trying migrate deploy..."
                    docker-compose exec -T app npx prisma migrate deploy || {
                        echo "❌ Could not initialize schema. Please check errors above."
                        exit 1
                    }
                }
                echo "✅ Schema initialized while preserving current data!"
                exit 0
            fi
        else
            echo "✅ Current data is older than backup. Safe to restore."
        fi
    fi
else
    echo "⚠️  Could not read current database state"
    echo "   Database might be empty or have connection issues"
fi

echo ""
echo "Step 2: Checking backup file..."
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "✅ Backup file found: $BACKUP_FILE ($BACKUP_SIZE)"

echo ""
echo "Step 3: Creating backup of current state..."
CURRENT_BACKUP="backup_before_restore_$(date +%Y%m%d_%H%M%S).sql"
docker-compose exec -T mysql mysqldump -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" > "$CURRENT_BACKUP" 2>/dev/null || {
    echo "⚠️  Warning: Could not create backup of current state"
}
if [ -f "$CURRENT_BACKUP" ]; then
    CURRENT_SIZE=$(du -h "$CURRENT_BACKUP" | cut -f1)
    echo "✅ Current state backed up to: $CURRENT_BACKUP ($CURRENT_SIZE)"
fi

echo ""
read -p "Step 4: Restore from backup $BACKUP_FILE? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restoration cancelled."
    exit 0
fi

echo ""
echo "Step 5: Restoring from backup..."
docker-compose exec -T mysql mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < "$BACKUP_FILE" && {
    echo "✅ Backup restored successfully!"
    echo ""
    echo "Step 6: Verifying restoration..."
    docker-compose exec -T mysql mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" -e "
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
    SELECT 'Supplier', COUNT(*) FROM Supplier;
    " 2>/dev/null || true
} || {
    echo "❌ Error restoring backup. Check the error above."
    exit 1
}

echo ""
echo "=========================================="
echo "Restoration Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Restart the application: docker-compose restart app"
echo "2. Verify the application: docker-compose logs -f app"
echo "3. Test login and check your data"
echo ""

