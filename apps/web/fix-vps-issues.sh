#!/bin/bash
# Comprehensive fix script for VPS issues
# This script addresses:
# 1. returnNaN errors from cached code
# 2. Malicious script activity
# 3. Container security

set -e

echo "========================================="
echo "VPS Fix Script - Starting..."
echo "========================================="

cd /opt/inventory-store/apps/web || exit 1

echo ""
echo "Step 1: Stopping containers..."
docker-compose down

echo ""
echo "Step 2: Pulling latest code..."
git pull origin main || echo "Warning: git pull failed, continuing..."

echo ""
echo "Step 3: Removing malicious files (if any)..."
docker-compose exec -T app sh -c "rm -f /tmp/cc.txt /tmp/javae /tmp/lok /tmp/kdevtmpfsi 2>/dev/null || true" || true

echo ""
echo "Step 4: Clearing Next.js build cache..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .swc

echo ""
echo "Step 5: Clearing Docker build cache..."
docker system prune -f
docker builder prune -f

echo ""
echo "Step 6: Removing old images..."
docker-compose down --rmi local || true

echo ""
echo "Step 7: Rebuilding containers from scratch..."
docker-compose build --no-cache --pull

echo ""
echo "Step 8: Starting containers..."
docker-compose up -d

echo ""
echo "Step 9: Waiting for services to be healthy..."
sleep 10

echo ""
echo "Step 10: Checking container status..."
docker-compose ps

echo ""
echo "Step 11: Checking for malicious processes..."
docker-compose exec -T app sh -c "ps aux | grep -E '(cc.txt|javae|lok|kdevtmpfsi)' | grep -v grep || echo 'No malicious processes found'" || true

echo ""
echo "========================================="
echo "Fix script completed!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Check logs: docker-compose logs -f app"
echo "2. Monitor for returnNaN errors"
echo "3. If issues persist, check container security"
echo ""

