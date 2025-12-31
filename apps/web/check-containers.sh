#!/bin/bash

# Health check script to monitor and restart containers if they're down
# This can be run via cron every few minutes as a safety net

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

LOG_FILE="/var/log/inventory-store-restart.log"

# Function to log messages
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S'): $1" | tee -a "$LOG_FILE"
}

# Check if containers are running
CONTAINERS_DOWN=false

# Check each service
if ! docker-compose ps app | grep -q "Up"; then
    log_message "WARNING: app container is down!"
    CONTAINERS_DOWN=true
fi

if ! docker-compose ps mysql | grep -q "Up"; then
    log_message "WARNING: mysql container is down!"
    CONTAINERS_DOWN=true
fi

if ! docker-compose ps nginx 2>/dev/null | grep -q "Up"; then
    # Nginx might not be running, that's okay
    log_message "INFO: nginx container is not running (optional service)"
fi

# If any critical containers are down, restart them
if [ "$CONTAINERS_DOWN" = true ]; then
    log_message "Restarting down containers..."
    docker-compose up -d
    sleep 5
    
    # Verify they're back up
    if docker-compose ps | grep -q "Up"; then
        log_message "✓ Containers restarted successfully"
    else
        log_message "✗ Failed to restart containers. Manual intervention required."
        exit 1
    fi
else
    log_message "✓ All containers are running normally"
fi

