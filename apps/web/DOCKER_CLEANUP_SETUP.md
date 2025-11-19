# Docker Cleanup Cron Job Setup

This guide explains how to set up an automated Docker cleanup cron job on your VPS.

## Overview

The `docker-cleanup.sh` script automatically removes:
- Unused Docker images (images not associated with any container)
- Docker build cache

This helps free up disk space on your VPS by removing old and unused Docker resources.

## Setup Instructions

### 1. Pull the Latest Changes

```bash
cd /opt/inventory-store
git pull origin main
cd apps/web
```

### 2. Make the Script Executable

```bash
chmod +x docker-cleanup.sh
```

### 3. Test the Script Manually

Before setting up the cron job, test the script to ensure it works:

```bash
./docker-cleanup.sh
```

You should see output showing:
- Disk usage before cleanup
- Cleanup process
- Disk usage after cleanup
- Space reclaimed

### 4. Create Log Directory (if needed)

The script logs to `/var/log/docker-cleanup.log`. Ensure the log directory exists:

```bash
sudo touch /var/log/docker-cleanup.log
sudo chmod 644 /var/log/docker-cleanup.log
```

### 5. Set Up Cron Job

Edit the root crontab:

```bash
sudo crontab -e
```

Add one of the following lines based on your preferred schedule:

#### Option 1: Run Weekly (Recommended)
Runs every Sunday at 2:00 AM:
```bash
0 2 * * 0 /opt/inventory-store/apps/web/docker-cleanup.sh >> /var/log/docker-cleanup.log 2>&1
```

#### Option 2: Run Monthly
Runs on the 1st of every month at 2:00 AM:
```bash
0 2 1 * * /opt/inventory-store/apps/web/docker-cleanup.sh >> /var/log/docker-cleanup.log 2>&1
```

#### Option 3: Run Every 3 Days
Runs every 3 days at 2:00 AM:
```bash
0 2 */3 * * /opt/inventory-store/apps/web/docker-cleanup.sh >> /var/log/docker-cleanup.log 2>&1
```

#### Option 4: Run Daily (Aggressive)
Runs every day at 2:00 AM:
```bash
0 2 * * * /opt/inventory-store/apps/web/docker-cleanup.sh >> /var/log/docker-cleanup.log 2>&1
```

### 6. Verify Cron Job

List the current cron jobs to verify:

```bash
sudo crontab -l
```

### 7. Monitor Logs

Check the cleanup logs:

```bash
tail -f /var/log/docker-cleanup.log
```

Or view recent entries:

```bash
tail -n 50 /var/log/docker-cleanup.log
```

## Cron Schedule Format

The cron schedule format is:
```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, where 0 and 7 are Sunday)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

## What Gets Cleaned

- **Unused Images**: Docker images that are not associated with any running or stopped container
- **Build Cache**: Docker build cache from previous builds

## What Does NOT Get Cleaned

- **Active Images**: Images currently used by running containers
- **Volumes**: Docker volumes are NOT removed (commented out in script to prevent data loss)
- **Containers**: No containers are removed

## Manual Cleanup

You can run the cleanup script manually at any time:

```bash
cd /opt/inventory-store/apps/web
./docker-cleanup.sh
```

## Disk Space Check

Check current Docker disk usage:

```bash
docker system df
```

## Troubleshooting

### Script Permission Denied
```bash
chmod +x /opt/inventory-store/apps/web/docker-cleanup.sh
```

### Cron Job Not Running
1. Check if cron service is running:
   ```bash
   sudo systemctl status cron
   ```

2. Check cron logs:
   ```bash
   sudo grep CRON /var/log/syslog
   ```

3. Ensure the script path is correct in crontab

### Log File Permission Issues
```bash
sudo chmod 644 /var/log/docker-cleanup.log
sudo chown root:root /var/log/docker-cleanup.log
```

## Recommended Schedule

For most production environments, **weekly cleanup** (Option 1) is recommended as it:
- Prevents excessive disk usage
- Doesn't interfere with active builds
- Runs during low-traffic hours (2 AM)
- Provides a good balance between cleanup frequency and system stability

## Notes

- The script uses `-f` flag to run non-interactively (no confirmation prompts)
- All cleanup operations are logged to `/var/log/docker-cleanup.log`
- The script will not remove images or cache that are currently in use
- Always test the script manually before setting up the cron job

