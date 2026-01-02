#!/bin/bash
# Diagnostic script for 504 Gateway Timeout errors

echo "========================================="
echo "504 Gateway Timeout Diagnostic"
echo "========================================="
echo ""

cd /opt/inventory-store/apps/web || exit 1

echo "1. Checking container status..."
docker-compose ps
echo ""

echo "2. Checking if app container is responding..."
docker-compose exec -T app curl -f http://localhost:3000/api/health || echo "❌ App container not responding"
echo ""

echo "3. Checking recent app logs (last 50 lines)..."
docker-compose logs --tail=50 app | tail -20
echo ""

echo "4. Checking for errors in app logs..."
docker-compose logs app | grep -iE "(error|exception|timeout|failed|crash)" | tail -10 || echo "No obvious errors found"
echo ""

echo "5. Checking nginx logs..."
docker-compose logs --tail=50 nginx | tail -20
echo ""

echo "6. Checking container resource usage..."
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" inventory_app inventory_nginx inventory_mysql
echo ""

echo "7. Testing app container connectivity..."
docker-compose exec -T app sh -c "curl -f http://localhost:3000 || echo 'App not responding on port 3000'"
echo ""

echo "8. Checking database connectivity from app..."
docker-compose exec -T app sh -c "timeout 5 nc -zv mysql 3306 2>&1 || echo 'Database connection check failed'"
echo ""

echo "========================================="
echo "Diagnostic complete!"
echo "========================================="

