# 🚨 URGENT: Data Recovery Guide

## Immediate Actions

### 1. Stop All Database Operations
**DO NOT** run any more migrations or schema changes until recovery is complete.

```bash
cd /opt/inventory-store/apps/web
docker-compose stop app
```

### 2. Run the Recovery Script

```bash
chmod +x recover-data-vps.sh
./recover-data-vps.sh
```

This will search for all possible backup sources.

## Recovery Methods (In Order of Likelihood)

### Method 1: SQL Dump Files (Most Likely)

Check for SQL files in these locations:

```bash
# Current directory
ls -lah *.sql backup_*.sql

# Parent directories
find .. -name "*.sql" -type f

# Common backup locations
ls -lah /opt/backups/*.sql
ls -lah /var/backups/*.sql
ls -lah ~/backups/*.sql
```

**If you find a SQL backup:**

```bash
# Restore it
docker-compose exec -T mysql mysql -uinventory_user -pinventory_password inventory_store < your-backup.sql

# Verify restoration
docker-compose exec mysql mysql -uinventory_user -pinventory_password inventory_store -e "SELECT COUNT(*) FROM User;"
```

### Method 2: Docker Volume Snapshots

Check if your hosting provider or Docker has volume snapshots:

```bash
# Check volume information
docker volume inspect inventory-store_mysql_data

# Check if volume has snapshots (varies by provider)
# For DigitalOcean, AWS, etc., check their backup/snapshot interfaces
```

**If you have a volume snapshot:**
- Restore it through your hosting provider's interface
- Or restore the volume from a backup tar file

### Method 3: MySQL Binary Logs

If binary logging was enabled, you might recover recent changes:

```bash
# Check for binary logs
docker-compose exec mysql ls -lh /var/lib/mysql/mysql-bin.*

# View binary log (requires MySQL expertise)
docker-compose exec mysql mysqlbinlog /var/lib/mysql/mysql-bin.000001
```

**⚠️ Warning:** Binary log recovery is complex and may not recover all data.

### Method 4: Hosting Provider Backups

Check your VPS hosting provider for:
- **Automatic backups** (many providers offer daily/weekly backups)
- **Volume snapshots** (DigitalOcean, AWS, etc.)
- **Server snapshots** (full system backups)

**Common Providers:**
- **DigitalOcean**: Check "Snapshots" in control panel
- **AWS**: Check EBS snapshots
- **Linode**: Check "Backups" section
- **Vultr**: Check "Snapshots" section
- **Hetzner**: Check "Backups" section

### Method 5: Application Logs

Check if any data was exported or logged:

```bash
# Check application logs for data exports
docker-compose logs app | grep -i "export\|backup\|dump"

# Check for any CSV exports
find . -name "*.csv" -type f
```

## If No Backups Are Found

### Option A: Recreate from Scratch

If you have no backups, you'll need to:

1. **Reinitialize the database schema:**
   ```bash
   ./safe-init-database-vps.sh
   ```

2. **Recreate users and stores manually** through the application

3. **Re-enter product data** (if you have it in another format)

### Option B: Contact Hosting Provider

Many hosting providers keep automatic backups even if you don't see them:

1. **Contact support** and ask about:
   - Automatic database backups
   - Volume snapshots
   - System-level backups
   - Point-in-time recovery options

2. **Provide them with:**
   - Your server IP
   - The approximate time data was lost
   - The database name: `inventory_store`

## Prevention for Future

After recovery, set up automatic backups:

### Create a Backup Script

```bash
# Create daily backup script
cat > /opt/inventory-store/apps/web/daily-backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/inventory-store"
mkdir -p "$BACKUP_DIR"
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T mysql mysqldump -uinventory_user -pinventory_password inventory_store > "$BACKUP_DIR/backup_$DATE.sql"
# Keep only last 7 days
find "$BACKUP_DIR" -name "backup_*.sql" -mtime +7 -delete
EOF

chmod +x /opt/inventory-store/apps/web/daily-backup.sh
```

### Set Up Cron Job

```bash
# Add to crontab (runs daily at 2 AM)
crontab -e
# Add this line:
0 2 * * * /opt/inventory-store/apps/web/daily-backup.sh
```

## Important Notes

- ⚠️ **DO NOT** run any more database migrations until recovery is complete
- ⚠️ **DO NOT** restart containers unnecessarily
- ✅ **DO** check all possible backup locations
- ✅ **DO** contact hosting provider support
- ✅ **DO** set up automatic backups after recovery

## Getting Help

If you need assistance:
1. Run `./recover-data-vps.sh` and share the output
2. Check your hosting provider's backup interface
3. Contact hosting provider support with the recovery script output

