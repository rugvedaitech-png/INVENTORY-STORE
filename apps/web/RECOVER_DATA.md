# Data Recovery Instructions

## If Data Was Lost

If you ran the initialization script and lost data, here are recovery options:

## Option 1: Restore from Docker Volume Backup

If you have a backup of the MySQL Docker volume:

```bash
cd /opt/inventory-store/apps/web

# Stop containers
docker-compose down

# Restore volume (if you have a backup)
docker volume restore mysql_data < backup-volume.tar

# Start containers
docker-compose up -d
```

## Option 2: Restore from SQL Dump

If you have a SQL dump file:

```bash
cd /opt/inventory-store/apps/web

# Restore from SQL dump
docker-compose exec -T mysql mysql -uinventory_user -pinventory_password inventory_store < your-backup.sql
```

## Option 3: Check for Automatic Backups

Docker volumes are stored at:
```bash
# Check volume location
docker volume inspect inventory-store_mysql_data

# Look for backup files in the volume
docker run --rm -v inventory-store_mysql_data:/data alpine ls -la /data
```

## Option 4: Check MySQL Binlogs (If Enabled)

If MySQL binary logging is enabled, you might be able to recover:

```bash
# Check if binlogs exist
docker-compose exec mysql ls -la /var/lib/mysql/mysql-bin.*

# Use mysqlbinlog to recover (requires MySQL expertise)
docker-compose exec mysql mysqlbinlog /var/lib/mysql/mysql-bin.000001 | mysql -uinventory_user -pinventory_password inventory_store
```

## Prevention: Always Backup Before Schema Changes

**Before running any database script, always backup:**

```bash
cd /opt/inventory-store/apps/web

# Create backup
docker-compose exec mysql mysqldump -uinventory_user -pinventory_password inventory_store > backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
ls -lh backup_*.sql
```

## Use the Safe Script

For future schema updates, use the safe script:

```bash
./safe-init-database-vps.sh
```

This script:
- ✅ Checks for existing data
- ✅ Creates automatic backups
- ✅ Only creates missing tables
- ✅ Never deletes existing data

## Contact Support

If you cannot recover your data and need help:
1. Check if you have any SQL dumps in your project directory
2. Check if you have volume backups
3. Review application logs for any data exports

