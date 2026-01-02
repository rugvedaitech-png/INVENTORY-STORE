# Database Backup Policy for Maintenance Operations

## Overview
**ALWAYS create a backup before any database maintenance operation.**

This document outlines the backup policy and procedures for database maintenance.

## Automatic Backup Script

We have a dedicated backup script: `create-db-backup.sh`

### Usage

```bash
# Create a backup with default name
./create-db-backup.sh

# Create a backup with custom prefix
./create-db-backup.sh "backup_before_migration"
```

### What It Does

1. ✅ Checks MySQL container is running
2. ✅ Creates a timestamped SQL dump
3. ✅ Verifies backup file was created
4. ✅ Checks backup contains data
5. ✅ Reports backup size and location

### Backup File Format

Backups are named: `{prefix}_{YYYYMMDD}_{HHMMSS}.sql`

Examples:
- `backup_20260102_201945.sql` (default)
- `backup_before_migrations_20260102_201945.sql` (custom prefix)

## Maintenance Scripts with Auto-Backup

The following scripts automatically create backups before running:

1. ✅ `apply-all-migrations.sh` - Creates backup before applying migrations
2. ✅ `safe-init-database-vps.sh` - Creates backup if existing data found
3. ⚠️ `restore-from-latest-backup.sh` - Creates backup of current state before restoring

## Manual Backup Before Maintenance

If you're running maintenance manually, always create a backup first:

```bash
# Option 1: Use the backup script
./create-db-backup.sh "backup_before_maintenance"

# Option 2: Manual backup
docker-compose exec -T mysql mysqldump \
    -uinventory_user \
    -pinventory_password \
    --single-transaction \
    inventory_store > backup_$(date +%Y%m%d_%H%M%S).sql
```

## Before Running These Operations

**ALWAYS backup first before:**

- ✅ Running database migrations
- ✅ Restoring from a backup
- ✅ Initializing database schema
- ✅ Running Prisma `db push` or `migrate deploy`
- ✅ Any manual SQL changes
- ✅ Schema modifications

## Backup Storage

### Current Location
Backups are stored in: `/opt/inventory-store/apps/web/`

### Recommended: Move to Dedicated Directory

```bash
# Create backup directory
mkdir -p /opt/backups/inventory-store

# Update backup script to use this directory
# Or move backups manually:
mv backup_*.sql /opt/backups/inventory-store/
```

### Backup Retention

**Recommended policy:**
- Keep last 7 days of daily backups
- Keep last 4 weeks of weekly backups
- Keep monthly backups for 6 months

**Cleanup script:**
```bash
# Remove backups older than 7 days
find . -name "backup_*.sql" -mtime +7 -delete
```

## Restoring from Backup

If something goes wrong during maintenance:

```bash
# Restore from a specific backup
docker-compose exec -T mysql mysql \
    -uinventory_user \
    -pinventory_password \
    inventory_store < backup_20260102_201945.sql

# Verify restoration
docker-compose exec mysql mysql \
    -uinventory_user \
    -pinventory_password \
    inventory_store -e "SELECT COUNT(*) FROM User;"
```

## Automated Daily Backups

### Setup Cron Job for Daily Backups

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * cd /opt/inventory-store/apps/web && ./create-db-backup.sh "daily_backup" && find . -name "daily_backup_*.sql" -mtime +7 -delete
```

### Setup Weekly Backups

```bash
# Add to crontab (runs every Sunday at 3 AM)
0 3 * * 0 cd /opt/inventory-store/apps/web && ./create-db-backup.sh "weekly_backup" && find . -name "weekly_backup_*.sql" -mtime +28 -delete
```

## Verification Checklist

Before starting maintenance:

- [ ] Backup script exists and is executable
- [ ] MySQL container is running
- [ ] Backup created successfully
- [ ] Backup file has content (check size > 0)
- [ ] Backup file is readable
- [ ] Know the backup file name for restoration

## Emergency Recovery

If maintenance fails and you need to restore:

1. **Stop the application:**
   ```bash
   docker-compose stop app
   ```

2. **Restore from backup:**
   ```bash
   docker-compose exec -T mysql mysql \
       -uinventory_user \
       -pinventory_password \
       inventory_store < backup_YYYYMMDD_HHMMSS.sql
   ```

3. **Verify restoration:**
   ```bash
   docker-compose exec mysql mysql \
       -uinventory_user \
       -pinventory_password \
       inventory_store -e "SHOW TABLES;"
   ```

4. **Restart application:**
   ```bash
   docker-compose restart app
   ```

## Best Practices

1. ✅ **Always backup before maintenance** - No exceptions
2. ✅ **Test backups** - Verify they can be restored
3. ✅ **Keep multiple backups** - Don't rely on a single backup
4. ✅ **Store backups off-server** - Copy to another location
5. ✅ **Document backup locations** - Know where backups are stored
6. ✅ **Automate backups** - Use cron jobs for regular backups

## Backup Script Features

- ✅ Automatic timestamp naming
- ✅ Verification of backup creation
- ✅ Size reporting
- ✅ Table count verification
- ✅ Error handling
- ✅ Single transaction (consistent backup)

## Questions?

If you're unsure about creating a backup:
- **When in doubt, backup first!**
- It's better to have an unnecessary backup than to lose data
- Backups are quick and don't impact performance significantly

