#!/bin/bash
# Script to resolve git conflict and run recovery

set -e

echo "=========================================="
echo "Resolving Git Conflict and Running Recovery"
echo "=========================================="

cd "$(dirname "$0")" || exit 1

echo ""
echo "Step 1: Discarding local changes to init-database-vps.sh..."
git checkout -- apps/web/init-database-vps.sh || git checkout -- init-database-vps.sh

echo ""
echo "Step 2: Pulling latest code..."
git pull origin main

echo ""
echo "Step 3: Making recovery script executable..."
chmod +x recover-data-vps.sh

echo ""
echo "Step 4: Running recovery script..."
./recover-data-vps.sh

