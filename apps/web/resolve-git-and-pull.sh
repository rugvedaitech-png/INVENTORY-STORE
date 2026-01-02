#!/bin/bash
# Script to resolve git conflicts and pull latest changes

set -e

cd "$(dirname "$0")" || exit 1

echo "=========================================="
echo "Resolving Git Conflicts and Pulling Latest"
echo "=========================================="
echo ""

echo "Step 1: Checking git status..."
git status --short
echo ""

echo "Step 2: Discarding local changes to apply-all-migrations.sh..."
git checkout -- apps/web/apply-all-migrations.sh 2>/dev/null || git checkout -- apply-all-migrations.sh
echo "✅ Local changes discarded"
echo ""

echo "Step 3: Pulling latest changes..."
git pull origin main
echo "✅ Latest changes pulled"
echo ""

echo "Step 4: Making scripts executable..."
chmod +x create-db-backup.sh 2>/dev/null || true
chmod +x apply-all-migrations.sh 2>/dev/null || true
chmod +x rebuild-app-after-migrations.sh 2>/dev/null || true
echo "✅ Scripts made executable"
echo ""

echo "=========================================="
echo "Done!"
echo "=========================================="
echo ""
echo "You can now use:"
echo "  ./create-db-backup.sh - Create a database backup"
echo "  ./apply-all-migrations.sh - Apply migrations (with auto-backup)"
echo ""

