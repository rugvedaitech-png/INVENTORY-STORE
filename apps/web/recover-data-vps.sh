#!/bin/bash
# Comprehensive Data Recovery Script
# This script attempts to recover lost database data

set -e

echo "=========================================="
echo "Data Recovery Script"
echo "=========================================="
echo ""
echo "⚠️  This script will attempt to recover lost database data"
echo ""

# Navigate to the project directory
cd "$(dirname "$0")" || exit 1

# Load environment variables
MYSQL_USER="${MYSQL_USER:-inventory_user}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-inventory_password}"
MYSQL_DATABASE="${MYSQL_DATABASE:-inventory_store}"

echo "Step 1: Checking Docker containers..."
if ! docker-compose ps mysql | grep -q "Up"; then
  echo "❌ MySQL container is not running. Starting it..."
  docker-compose up -d mysql
  echo "   Waiting for MySQL to be ready..."
  sleep 10
fi

echo ""
echo "Step 2: Checking current database state..."
CURRENT_TABLES=$(docker-compose exec -T mysql mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" -e "SHOW TABLES;" 2>/dev/null | tail -n +2 | wc -l || echo "0")
echo "   Current tables: $CURRENT_TABLES"

if [ "$CURRENT_TABLES" -gt "0" ]; then
  echo "   Checking if tables have data..."
  USER_COUNT=$(docker-compose exec -T mysql mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" -e "SELECT COUNT(*) as count FROM User;" 2>/dev/null | tail -n 1 || echo "0")
  echo "   Users in database: $USER_COUNT"
fi

echo ""
echo "Step 3: Searching for SQL backup files..."
echo "   Checking current directory..."
SQL_BACKUPS=$(find . -maxdepth 2 -name "*.sql" -o -name "backup_*.sql" -o -name "*dump*.sql" 2>/dev/null | head -10)
if [ -n "$SQL_BACKUPS" ]; then
  echo "   ✅ Found SQL backup files:"
  echo "$SQL_BACKUPS" | while read -r backup; do
    SIZE=$(du -h "$backup" 2>/dev/null | cut -f1)
    DATE=$(stat -c %y "$backup" 2>/dev/null || stat -f "%Sm" "$backup" 2>/dev/null || echo "unknown")
    echo "      - $backup ($SIZE, $DATE)"
  done
else
  echo "   ❌ No SQL backup files found in current directory"
fi

echo ""
echo "   Checking parent directories..."
PARENT_SQL_BACKUPS=$(find .. -maxdepth 3 -name "*.sql" -o -name "backup_*.sql" 2>/dev/null | head -10)
if [ -n "$PARENT_SQL_BACKUPS" ]; then
  echo "   ✅ Found SQL backup files in parent directories:"
  echo "$PARENT_SQL_BACKUPS" | while read -r backup; do
    SIZE=$(du -h "$backup" 2>/dev/null | cut -f1)
    echo "      - $backup ($SIZE)"
  done
fi

echo ""
echo "Step 4: Checking Docker volume for backups..."
VOLUME_NAME=$(docker-compose config --volumes | grep mysql_data | head -1 || echo "inventory-store_mysql_data")
echo "   Volume name: $VOLUME_NAME"

VOLUME_PATH=$(docker volume inspect "$VOLUME_NAME" 2>/dev/null | grep -oP '(?<="Mountpoint": ")[^"]*' || echo "")
if [ -n "$VOLUME_PATH" ]; then
  echo "   Volume path: $VOLUME_PATH"
  echo "   ⚠️  Note: You may need root access to check volume contents"
  echo "   To check volume contents manually:"
  echo "      sudo ls -la $VOLUME_PATH"
else
  echo "   ⚠️  Could not determine volume path"
fi

echo ""
echo "Step 5: Checking for MySQL binary logs..."
BINLOG_EXISTS=$(docker-compose exec -T mysql ls /var/lib/mysql/mysql-bin.* 2>/dev/null | wc -l || echo "0")
if [ "$BINLOG_EXISTS" -gt "0" ]; then
  echo "   ✅ Found MySQL binary logs!"
  echo "   Binary logs found:"
  docker-compose exec -T mysql ls -lh /var/lib/mysql/mysql-bin.* 2>/dev/null | head -5 || true
  echo ""
  echo "   ⚠️  Binary log recovery requires MySQL expertise"
  echo "   You can try: docker-compose exec mysql mysqlbinlog /var/lib/mysql/mysql-bin.000001"
else
  echo "   ❌ No binary logs found (binary logging may not be enabled)"
fi

echo ""
echo "Step 6: Checking for Docker volume snapshots..."
echo "   Checking if volume has any backup metadata..."
docker volume inspect "$VOLUME_NAME" 2>/dev/null | grep -i backup || echo "   No backup metadata found"

echo ""
echo "Step 7: Checking for automatic backups in common locations..."
BACKUP_LOCATIONS=(
  "/opt/backups"
  "/var/backups"
  "/root/backups"
  "$HOME/backups"
  "./backups"
)

for location in "${BACKUP_LOCATIONS[@]}"; do
  if [ -d "$location" ] && [ -n "$(find "$location" -name "*.sql" -o -name "*mysql*" 2>/dev/null | head -1)" ]; then
    echo "   ✅ Found backups in: $location"
    find "$location" -name "*.sql" -o -name "*mysql*" 2>/dev/null | head -5
  fi
done

echo ""
echo "=========================================="
echo "Recovery Options Summary"
echo "=========================================="
echo ""

if [ -n "$SQL_BACKUPS" ] || [ -n "$PARENT_SQL_BACKUPS" ]; then
  echo "✅ RECOMMENDED: Restore from SQL backup"
  echo ""
  echo "   To restore from a SQL backup file:"
  echo "   docker-compose exec -T mysql mysql -u$MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE < your-backup.sql"
  echo ""
  echo "   Available backup files:"
  [ -n "$SQL_BACKUPS" ] && echo "$SQL_BACKUPS"
  [ -n "$PARENT_SQL_BACKUPS" ] && echo "$PARENT_SQL_BACKUPS"
  echo ""
fi

if [ "$BINLOG_EXISTS" -gt "0" ]; then
  echo "⚠️  OPTION: Recover from binary logs (advanced)"
  echo "   This requires MySQL expertise. Binary logs may contain recent changes."
  echo ""
fi

echo "❌ If no backups are found:"
echo "   1. Check if you have any manual backups elsewhere"
echo "   2. Check if your hosting provider has automatic backups"
echo "   3. Check if you exported data recently"
echo "   4. Contact your hosting provider support for volume snapshots"
echo ""

echo "=========================================="
echo "Next Steps"
echo "=========================================="
echo ""
echo "If you found a backup file, you can restore it with:"
echo "  docker-compose exec -T mysql mysql -u$MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE < backup-file.sql"
echo ""
echo "After restoration, verify data:"
echo "  docker-compose exec mysql mysql -u$MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE -e \"SELECT COUNT(*) FROM User;\""
echo ""

