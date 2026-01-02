#!/bin/bash
# Script to rebuild the app container after database migrations
# This ensures the Prisma client is regenerated with the latest schema

set -e

cd "$(dirname "$0")" || exit 1

echo "=========================================="
echo "Rebuilding Application After Migrations"
echo "=========================================="
echo ""

echo "Step 1: Stopping application..."
docker-compose stop app
echo "✅ Application stopped"
echo ""

echo "Step 2: Rebuilding application container..."
echo "   This will regenerate Prisma client with the latest schema"
docker-compose build --no-cache app
echo "✅ Application rebuilt"
echo ""

echo "Step 3: Starting application..."
docker-compose up -d app
echo "✅ Application started"
echo ""

echo "Step 4: Waiting for application to be ready..."
sleep 10
echo "✅ Wait complete"
echo ""

echo "Step 5: Checking application health..."
if docker-compose exec -T app curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Application is healthy"
else
    echo "⚠️  Health check failed, but application may still be starting"
    echo "   Check logs: docker-compose logs -f app"
fi
echo ""

echo "=========================================="
echo "Rebuild Complete!"
echo "=========================================="
echo ""
echo "The application has been rebuilt with the updated Prisma client."
echo "The address and gstin columns should now be recognized."
echo ""
echo "Next steps:"
echo "1. Check application logs: docker-compose logs -f app"
echo "2. Test the application: https://ordernestpro.rugvedaitech.com"
echo "3. The 'address column does not exist' error should be resolved"
echo ""

