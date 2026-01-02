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
echo "Step 3: Pushing database schema (creates all tables)..."
echo "This will create all tables from prisma/schema.prisma"
docker-compose exec -T app npx prisma db push --accept-data-loss || {
  echo ""
  echo "Warning: db push failed. Trying alternative method..."
  echo "Step 3b: Using migrate deploy instead..."
  docker-compose exec -T app npx prisma migrate deploy || {
    echo ""
    echo "Error: Both db push and migrate deploy failed."
    echo "Please check the database connection and try again."
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

