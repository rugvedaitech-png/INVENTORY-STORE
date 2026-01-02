#!/bin/bash
# Script to check current database state and restore from backup if needed

set -e

cd "$(dirname "$0")" || exit 1

MYSQL_USER="${MYSQL_USER:-inventory_user}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-inventory_password}"
MYSQL_DATABASE="${MYSQL_DATABASE:-inventory_store}"
BACKUP_FILE="backup_20251213_110926.sql"

echo "=========================================="
echo "Database State Check and Backup Restoration"
echo "=========================================="
echo ""

echo "Step 1: Checking current database state..."
echo ""
echo "Current table counts:"
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
SELECT 'Supplier', COUNT(*) FROM Supplier
UNION ALL
SELECT 'PurchaseOrder', COUNT(*) FROM PurchaseOrder;
" 2>/dev/null || echo "Error checking table counts"

echo ""
echo "Step 2: Checking backup file..."
if [ -f "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    BACKUP_DATE=$(stat -c %y "$BACKUP_FILE" 2>/dev/null || stat -f "%Sm" "$BACKUP_FILE" 2>/dev/null || echo "unknown")
    echo "✅ Backup file found: $BACKUP_FILE"
    echo "   Size: $BACKUP_SIZE"
    echo "   Date: $BACKUP_DATE"
    echo ""
    
    echo "Step 3: Preview of backup file (first 20 lines)..."
    head -20 "$BACKUP_FILE" | grep -E "^--|^CREATE|^INSERT|^USE" | head -10 || true
    echo ""
    
    read -p "Do you want to restore from this backup? This will REPLACE current data (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "Step 4: Creating backup of current state first..."
        CURRENT_BACKUP="backup_before_restore_$(date +%Y%m%d_%H%M%S).sql"
        docker-compose exec -T mysql mysqldump -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" > "$CURRENT_BACKUP" 2>/dev/null || {
            echo "⚠️  Warning: Could not create backup of current state"
        }
        if [ -f "$CURRENT_BACKUP" ]; then
            echo "✅ Current state backed up to: $CURRENT_BACKUP"
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
            SELECT 'Customer', COUNT(*) FROM Customer;
            " 2>/dev/null || true
        } || {
            echo "❌ Error restoring backup. Check the error above."
            exit 1
        }
    else
        echo "Restoration cancelled."
    fi
else
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

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

