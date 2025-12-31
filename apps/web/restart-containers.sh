#!/bin/bash

# Script to restart Docker containers every 12 hours
# This ensures containers are refreshed and don't accumulate issues

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "$(date): Restarting Docker containers..."
docker-compose restart

# Verify containers are running
sleep 5
echo "$(date): Checking container status..."
docker-compose ps

# Log the restart
echo "$(date): Container restart completed" >> /var/log/inventory-store-restart.log

