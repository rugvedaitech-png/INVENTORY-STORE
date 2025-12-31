# Automatic Container Restart Setup

This guide explains how to ensure Docker containers automatically restart and stay running on your VPS.

## Current Configuration

The `docker-compose.yml` already has `restart: always` for all services, which means:
- Containers will automatically restart if they crash
- Containers will restart after system reboot
- Docker daemon will keep containers running

## Additional Setup: Periodic Restarts (Every 12 Hours)

To ensure containers are refreshed every 12 hours (prevents memory leaks, stale connections, etc.), follow these steps:

### Option 1: Automated Setup (Recommended)

1. SSH into your VPS:
```bash
ssh root@your-vps-ip
```

2. Navigate to the project directory:
```bash
cd /opt/inventory-store/apps/web
```

3. Make the setup script executable and run it:
```bash
chmod +x setup-auto-restart.sh
./setup-auto-restart.sh
```

This will:
- Create a restart script
- Set up a cron job to restart containers every 12 hours
- Configure logging

### Option 2: Manual Setup

1. Make the restart script executable:
```bash
chmod +x restart-containers.sh
```

2. Add a cron job manually:
```bash
crontab -e
```

3. Add this line to restart containers every 12 hours:
```cron
0 */12 * * * /opt/inventory-store/apps/web/restart-containers.sh >> /var/log/inventory-store-restart.log 2>&1
```

This will restart containers at:
- 00:00 (midnight)
- 12:00 (noon)

### Verify Setup

Check if the cron job is set up:
```bash
crontab -l
```

Check restart logs:
```bash
tail -f /var/log/inventory-store-restart.log
```

## Container Restart Policies

The docker-compose.yml uses `restart: always` which means:

| Policy | Behavior |
|--------|----------|
| `always` | Always restart the container if it stops (default) |
| `unless-stopped` | Restart unless explicitly stopped |
| `on-failure` | Restart only on failure |
| `no` | Never restart |

## Manual Container Management

### Check container status:
```bash
docker-compose ps
```

### Restart all containers:
```bash
docker-compose restart
```

### Restart a specific service:
```bash
docker-compose restart app
docker-compose restart mysql
docker-compose restart nginx
```

### View container logs:
```bash
docker-compose logs -f app
docker-compose logs -f mysql
```

### Stop and start containers:
```bash
docker-compose stop
docker-compose start
```

## Troubleshooting

### Containers not restarting automatically:

1. Check Docker daemon is running:
```bash
systemctl status docker
```

2. Check container restart policy:
```bash
docker inspect inventory_app | grep -i restart
```

3. Check container logs for errors:
```bash
docker-compose logs app
```

### Cron job not working:

1. Check cron service is running:
```bash
systemctl status cron
```

2. Check cron logs:
```bash
grep CRON /var/log/syslog
```

3. Verify the script path is correct:
```bash
ls -la /opt/inventory-store/apps/web/restart-containers.sh
```

## Monitoring

### Set up monitoring alerts (optional):

You can add a health check script to monitor containers:

```bash
# Create a monitoring script
cat > /opt/inventory-store/apps/web/check-containers.sh << 'EOF'
#!/bin/bash
cd /opt/inventory-store/apps/web
if ! docker-compose ps | grep -q "Up"; then
    echo "$(date): Containers are down! Restarting..." >> /var/log/inventory-store-restart.log
    docker-compose up -d
fi
EOF

chmod +x /opt/inventory-store/apps/web/check-containers.sh

# Add to cron to check every 5 minutes
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/inventory-store/apps/web/check-containers.sh") | crontab -
```

## Notes

- The `restart: always` policy in docker-compose.yml ensures containers restart automatically
- The cron job provides additional periodic restarts every 12 hours
- Logs are written to `/var/log/inventory-store-restart.log`
- Containers will restart automatically after system reboot

