#!/bin/bash
# Migration script to add billLayout column to Store table
# Run this script on your production server

echo "Running migration to add billLayout column..."

# Option 1: Using Prisma migrate (recommended)
docker-compose exec app npx prisma migrate deploy

# Option 2: If migrate deploy doesn't work, use db push
# docker-compose exec app npx prisma db push

# Option 3: Manual SQL execution (if above don't work)
# docker-compose exec mysql mysql -u inventory_user -pinventory_password inventory_store -e "ALTER TABLE Store ADD COLUMN billLayout ENUM('VERTICAL', 'REGULAR') NOT NULL DEFAULT 'REGULAR';"

echo "Migration completed!"

