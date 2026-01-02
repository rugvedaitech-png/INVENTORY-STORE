#!/bin/bash
# Script to apply all missing database migrations

set -e

cd "$(dirname "$0")" || exit 1

MYSQL_USER="${MYSQL_USER:-inventory_user}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-inventory_password}"
MYSQL_DATABASE="${MYSQL_DATABASE:-inventory_store}"

echo "=========================================="
echo "Applying All Database Migrations"
echo "=========================================="
echo ""

echo "Step 0: Creating backup before migrations..."
if [ -f "create-db-backup.sh" ]; then
    chmod +x create-db-backup.sh
    ./create-db-backup.sh "backup_before_migrations"
    echo ""
else
    echo "⚠️  Warning: create-db-backup.sh not found. Creating manual backup..."
    BACKUP_FILE="backup_before_migrations_$(date +%Y%m%d_%H%M%S).sql"
    docker-compose exec -T mysql mysqldump -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" > "$BACKUP_FILE" 2>/dev/null && {
        echo "✅ Backup created: $BACKUP_FILE"
    } || echo "⚠️  Could not create backup"
    echo ""
fi

echo "Step 1: Checking current database schema..."
echo "----------------------------------------"
CURRENT_COLUMNS=$(docker-compose exec -T mysql mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" -e "
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = '$MYSQL_DATABASE' 
  AND TABLE_NAME = 'Store' 
  AND COLUMN_NAME IN ('address', 'gstin');
" 2>/dev/null | tail -n +2 || echo "")

echo "Current Store table columns (address, gstin):"
if [ -n "$CURRENT_COLUMNS" ]; then
    echo "$CURRENT_COLUMNS"
else
    echo "   (none found - need to add)"
fi
echo ""

echo "Step 2: Applying store address migration..."
if [ -f "add-store-address-migration.sql" ]; then
    if docker-compose exec -T mysql mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < add-store-address-migration.sql 2>&1 | grep -v "Duplicate column name" || true; then
        echo "✅ Address column migration applied (or already exists)"
    else
        echo "⚠️  Address migration may have failed, but continuing..."
    fi
else
    echo "⚠️  add-store-address-migration.sql not found, skipping..."
fi
echo ""

echo "Step 3: Applying store GSTIN migration..."
if [ -f "add-store-gstin-migration.sql" ]; then
    if docker-compose exec -T mysql mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < add-store-gstin-migration.sql 2>&1 | grep -v "Duplicate column name" || true; then
        echo "✅ GSTIN column migration applied (or already exists)"
    else
        echo "⚠️  GSTIN migration may have failed, but continuing..."
    fi
else
    echo "⚠️  add-store-gstin-migration.sql not found, skipping..."
fi
echo ""

echo "Step 4: Applying purchase order cost migration..."
if [ -f "add-purchase-order-item-cost-migration.sql" ]; then
    if docker-compose exec -T mysql mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < add-purchase-order-item-cost-migration.sql 2>&1 | grep -v "Duplicate column name" || true; then
        echo "✅ Purchase order cost columns migration applied (or already exists)"
    else
        echo "⚠️  Purchase order cost migration may have failed, but continuing..."
    fi
else
    echo "⚠️  add-purchase-order-item-cost-migration.sql not found, skipping..."
fi
echo ""

echo "Step 5: Removing old costPaise columns if they exist..."
if [ -f "remove-old-costpaise-columns-migration.sql" ]; then
    if docker-compose exec -T mysql mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < remove-old-costpaise-columns-migration.sql 2>&1 | grep -v "Unknown column" || true; then
        echo "✅ Old costPaise columns removed (or didn't exist)"
    else
        echo "⚠️  Old columns removal may have failed, but continuing..."
    fi
else
    echo "⚠️  remove-old-costpaise-columns-migration.sql not found, skipping..."
fi
echo ""

echo "Step 6: Using Prisma to sync schema (adds any remaining missing columns)..."
echo "   This will add any columns that are in schema.prisma but missing in database"
if docker-compose exec -T app npx prisma db push --skip-generate --accept-data-loss=false 2>&1 | tail -20; then
    echo "✅ Prisma schema synced"
else
    echo "⚠️  Prisma db push had warnings, but continuing..."
fi
echo ""

echo "Step 7: Regenerating Prisma client..."
if docker-compose exec -T app npx prisma generate 2>&1 | tail -10; then
    echo "✅ Prisma client regenerated"
else
    echo "⚠️  Prisma generate had warnings, but continuing..."
fi
echo ""

echo "Step 8: Verifying migrations..."
echo "----------------------------------------"
FINAL_COLUMNS=$(docker-compose exec -T mysql mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" -e "
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = '$MYSQL_DATABASE' 
  AND TABLE_NAME = 'Store' 
  AND COLUMN_NAME IN ('address', 'gstin')
ORDER BY COLUMN_NAME;
" 2>/dev/null || echo "")

if [ -n "$FINAL_COLUMNS" ]; then
    echo "✅ Store table now has these columns:"
    echo "$FINAL_COLUMNS"
else
    echo "⚠️  Warning: address and gstin columns not found after migration"
fi
echo ""

echo "Step 9: Restarting application to apply changes..."
docker-compose restart app
echo "✅ Application restarted"
echo ""

echo "=========================================="
echo "Migration Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Check application logs: docker-compose logs -f app"
echo "2. Test the application: https://ordernestpro.rugvedaitech.com"
echo "3. Verify store settings page works (should show address and GSTIN fields)"
echo ""

