#!/bin/bash
# SAFE Database Initialization Script for VPS
# This script checks for existing data and only creates missing tables
# WITHOUT deleting existing data

set -e

echo "=========================================="
echo "SAFE Database Initialization Script"
echo "=========================================="
echo ""
echo "⚠️  This script will:"
echo "   1. Check if tables already exist"
echo "   2. Only create MISSING tables"
echo "   3. NEVER delete existing data"
echo ""

# Navigate to the project directory
cd "$(dirname "$0")" || exit 1

# Check if we're in the right directory
if [ ! -f "prisma/schema.prisma" ]; then
  echo "Error: prisma/schema.prisma not found. Please run this script from apps/web directory."
  exit 1
fi

# Load environment variables
MYSQL_USER="${MYSQL_USER:-inventory_user}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-inventory_password}"
MYSQL_DATABASE="${MYSQL_DATABASE:-inventory_store}"

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
echo "Step 3: Checking for existing tables..."
EXISTING_TABLES=$(docker-compose exec -T mysql mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" -e "SHOW TABLES;" 2>/dev/null | wc -l || echo "0")

if [ "$EXISTING_TABLES" -gt "1" ]; then
  echo "⚠️  WARNING: Found existing tables in database!"
  echo "   This means you have existing data."
  echo ""
  echo "   Tables found:"
  docker-compose exec -T mysql mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" -e "SHOW TABLES;" 2>/dev/null || true
  echo ""
  read -p "Do you want to continue? This will only create MISSING tables (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted. No changes made."
    exit 0
  fi
  echo ""
  echo "Step 4: Creating backup before proceeding..."
  BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
  docker-compose exec -T mysql mysqldump -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" > "$BACKUP_FILE" 2>/dev/null || {
    echo "⚠️  Warning: Could not create backup. Proceeding anyway..."
  }
  if [ -f "$BACKUP_FILE" ]; then
    echo "✅ Backup created: $BACKUP_FILE"
  fi
else
  echo "✅ Database appears to be empty. Safe to initialize."
fi

echo ""
echo "Step 5: Checking if User table exists..."
USER_TABLE_EXISTS=$(docker-compose exec -T mysql mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" -e "SHOW TABLES LIKE 'User';" 2>/dev/null | grep -c "User" || echo "0")

if [ "$USER_TABLE_EXISTS" -eq "0" ]; then
  echo "   User table does not exist. Will create all tables."
  echo ""
  echo "Step 6: Creating database schema (SAFE MODE - no data loss)..."
  
  # Try migrate deploy first (safest - only applies missing migrations)
  echo "   Attempting: prisma migrate deploy (safest method)..."
  if docker-compose exec -T app npx prisma migrate deploy 2>&1 | tee /tmp/prisma_output.log; then
    echo "✅ Schema created using migrations!"
  else
    echo "   Migrate deploy didn't work. Trying db push (without --accept-data-loss)..."
    # Use db push WITHOUT --accept-data-loss - this will fail if it would cause data loss
    if docker-compose exec -T app npx prisma db push --skip-generate 2>&1 | tee /tmp/prisma_output.log; then
      echo "✅ Schema created using db push!"
    else
      echo ""
      echo "❌ Error: Could not create schema safely."
      echo "   This might mean there are schema conflicts."
      echo ""
      echo "   Please check the error above and consider:"
      echo "   1. Reviewing the Prisma schema"
      echo "   2. Manually creating missing tables"
      echo "   3. Using prisma migrate dev (for development only)"
      exit 1
    fi
  fi
else
  echo "✅ User table already exists. Schema appears to be initialized."
  echo ""
  echo "Step 6: Verifying schema is up to date..."
  # Just verify, don't push changes
  docker-compose exec -T app npx prisma migrate status || {
    echo "⚠️  Warning: Migration status check failed. This is OK if you're not using migrations."
  }
fi

echo ""
echo "Step 7: Verifying database schema..."
TABLES=$(docker-compose exec -T mysql mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" -e "SHOW TABLES;" 2>/dev/null || echo "")
if [ -n "$TABLES" ]; then
  echo "✅ Tables in database:"
  echo "$TABLES"
else
  echo "⚠️  Warning: Could not verify tables. Please check manually."
fi

echo ""
echo "=========================================="
echo "Database initialization completed!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Restart the application: docker-compose restart app"
echo "2. Verify the application is working: docker-compose logs -f app"
echo ""
if [ -f "$BACKUP_FILE" ]; then
  echo "📦 Backup saved at: $BACKUP_FILE"
  echo "   Keep this backup safe in case you need to restore!"
fi
echo ""

