#!/bin/bash

# Setup script to configure automatic container restarts every 12 hours
# Run this script once on your VPS to set up the cron job

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESTART_SCRIPT="$SCRIPT_DIR/restart-containers.sh"

# Make the restart script executable
chmod +x "$RESTART_SCRIPT"

# Create log directory if it doesn't exist
sudo mkdir -p /var/log
sudo touch /var/log/inventory-store-restart.log
sudo chmod 666 /var/log/inventory-store-restart.log

# Add cron job to restart containers every 12 hours
CRON_JOB="0 */12 * * * $RESTART_SCRIPT >> /var/log/inventory-store-restart.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "$RESTART_SCRIPT"; then
    echo "Cron job already exists. Skipping..."
else
    # Add the cron job
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo "✓ Cron job added successfully!"
    echo "Containers will restart every 12 hours at 00:00 and 12:00"
fi

# Display current cron jobs
echo ""
echo "Current cron jobs:"
crontab -l | grep -E "(restart-containers|inventory)"

echo ""
echo "Setup complete! Containers will automatically restart every 12 hours."
echo "Logs will be written to: /var/log/inventory-store-restart.log"

