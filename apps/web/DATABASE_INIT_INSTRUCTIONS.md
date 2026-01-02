# Database Initialization Instructions

## Critical Issue: "The table 'User' does not exist"

If you're seeing this error:
```
The table `User` does not exist in the current database.
```

This means the database schema hasn't been initialized. The database is empty and needs to be set up.

## Quick Fix

Run the initialization script on your VPS:

```bash
cd /opt/inventory-store/apps/web

# Pull the latest code (includes the init script)
git pull origin main

# Make the script executable
chmod +x init-database-vps.sh

# Run the initialization script
./init-database-vps.sh
```

## What the Script Does

1. **Checks Docker containers** - Ensures MySQL is running
2. **Pushes database schema** - Creates all tables from `prisma/schema.prisma`
3. **Verifies tables** - Confirms the schema was created successfully

## Alternative: Manual Initialization

If the script doesn't work, you can initialize manually:

```bash
# Option 1: Using prisma db push (recommended for empty database)
docker-compose exec app npx prisma db push

# Option 2: Using prisma migrate deploy (if migrations exist)
docker-compose exec app npx prisma migrate deploy
```

## After Initialization

1. **Restart the application:**
   ```bash
   docker-compose restart app
   ```

2. **Check logs to verify:**
   ```bash
   docker-compose logs -f app
   ```

3. **Verify tables exist:**
   ```bash
   docker-compose exec mysql mysql -uinventory_user -pinventory_password inventory_store -e "SHOW TABLES;"
   ```

## Important Notes

- **Data Loss Warning**: `prisma db push` will reset the database if it detects schema changes. Only use this on a fresh/empty database.
- **Backup First**: If you have existing data, back it up before running initialization.
- **Migrations**: After initialization, use `prisma migrate deploy` for future schema changes.

## Troubleshooting

### Error: "MySQL container is not running"
```bash
docker-compose up -d mysql
# Wait 10-15 seconds for MySQL to initialize
./init-database-vps.sh
```

### Error: "Connection refused"
- Check that MySQL container is healthy: `docker-compose ps`
- Verify DATABASE_URL in your `.env` file matches docker-compose.yml settings
- Check MySQL logs: `docker-compose logs mysql`

### Error: "Permission denied"
```bash
chmod +x init-database-vps.sh
```

