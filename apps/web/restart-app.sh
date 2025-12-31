#!/bin/bash

# Script to restart the application container on VPS
# Usage: ./restart-app.sh

echo "Restarting application..."

# Check if docker-compose is available
if command -v docker-compose &> /dev/null; then
    echo "Using docker-compose..."
    docker-compose restart app
    if [ $? -eq 0 ]; then
        echo "✓ Application restarted successfully using docker-compose"
    else
        echo "⚠ docker-compose restart failed, trying alternative methods..."
    fi
elif command -v docker &> /dev/null && docker compose version &> /dev/null; then
    echo "Using docker compose (v2)..."
    docker compose restart app
    if [ $? -eq 0 ]; then
        echo "✓ Application restarted successfully using docker compose"
    else
        echo "⚠ docker compose restart failed, trying alternative methods..."
    fi
fi

# Alternative: Restart using docker directly
if docker ps | grep -q inventory_app; then
    echo "Restarting container directly using docker..."
    docker restart inventory_app
    if [ $? -eq 0 ]; then
        echo "✓ Application restarted successfully using docker restart"
    else
        echo "✗ Failed to restart application container"
        exit 1
    fi
else
    echo "⚠ Application container 'inventory_app' not found"
    echo "Available containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}"
    exit 1
fi

echo ""
echo "Checking application status..."
sleep 2
docker ps | grep inventory_app && echo "✓ Application container is running" || echo "⚠ Application container status unclear"

