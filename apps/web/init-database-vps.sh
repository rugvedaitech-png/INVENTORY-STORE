#!/bin/bash
# Script to initialize the database schema on VPS
# This creates all tables from the Prisma schema

set -e

echo "=========================================="
echo "Database Initialization Script for VPS"
echo "=========================================="

# Navigate to the project directory
cd "$(dirname "$0")" || exit 1

# Check if we're in the right directory
if [ ! -f "prisma/schema.prisma" ]; then
  echo "Error: prisma/schema.prisma not found. Please run this script from apps/web directory."
  exit 1
fi

echo ""
echo "Step 1: Checking Docker containers..."
if ! docker-compose ps mysql | grep -q "Up"; then
  echo "Error: MySQL container is not running. Please start it first:"
  echo "  docker-compose up -d mysql"
  exit 1
fi

echo ""
echo "Step 2: Waiting for MySQL to be ready..."
sleep 5

echo ""
echo "Step 3: Checking for existing data..."
EXISTING_TABLES=$(docker-compose exec -T mysql mysql -u${MYSQL_USER:-inventory_user} -p${MYSQL_PASSWORD:-inventory_password} ${MYSQL_DATABASE:-inventory_store} -e "SHOW TABLES;" 2>/dev/null | wc -l || echo "0")

if [ "$EXISTING_TABLES" -gt "1" ]; then
  echo "⚠️  WARNING: Found existing tables! Creating backup first..."
  BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
  docker-compose exec -T mysql mysqldump -u${MYSQL_USER:-inventory_user} -p${MYSQL_PASSWORD:-inventory_password} ${MYSQL_DATABASE:-inventory_store} > "$BACKUP_FILE" 2>/dev/null || echo "⚠️  Could not create backup"
  if [ -f "$BACKUP_FILE" ]; then
    echo "✅ Backup created: $BACKUP_FILE"
  fi
fi

echo ""
echo "Step 4: Pushing database schema (creates all tables)..."
echo "This will create all tables from prisma/schema.prisma"
echo "⚠️  Using SAFE mode - will NOT delete existing data"
# Try migrate deploy first (safest)
docker-compose exec -T app npx prisma migrate deploy 2>/dev/null || {
  # If migrate deploy fails, try db push WITHOUT --accept-data-loss
  # This will fail if it would cause data loss (which is what we want)
  docker-compose exec -T app npx prisma db push --skip-generate || {
    echo ""
    echo "Error: Could not create schema."
    echo "If you have existing data, use safe-init-database-vps.sh instead."
    exit 1
  }
}

echo ""
echo "Step 4: Verifying database schema..."
docker-compose exec -T mysql mysql -u${MYSQL_USER:-inventory_user} -p${MYSQL_PASSWORD:-inventory_password} ${MYSQL_DATABASE:-inventory_store} -e "
SHOW TABLES;
" || {
  echo "Warning: Could not verify tables. Please check manually."
}

echo ""
echo "=========================================="
echo "Database initialization completed!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Restart the application: docker-compose restart app"
echo "2. Verify the application is working: docker-compose logs -f app"
echo "3. If you need to seed data, run: docker-compose exec app npm run db:seed"
echo ""

