# Run Tax Fields Migration on VPS

## Problem
The application is trying to query `taxRate`, `taxableAmount`, and `taxAmount` columns from the `Order` table, but these columns don't exist in the VPS database yet.

## Solution
Run the migration SQL script on your VPS database.

## Steps

### Option 1: Using MySQL Command Line (Recommended)

1. SSH into your VPS:
```bash
ssh root@your-vps-ip
```

2. Navigate to the project directory:
```bash
cd /opt/inventory-store/apps/web
```

3. Connect to MySQL:
```bash
mysql -u root -p inventory_store
```
(Enter your MySQL root password when prompted)

4. Run the migration script:
```sql
source run-tax-fields-migration.sql;
```

Or copy and paste the contents of `run-tax-fields-migration.sql` directly into the MySQL prompt.

### Option 2: Using Docker MySQL Container

If your MySQL is running in Docker:

1. Find the MySQL container:
```bash
docker ps | grep mysql
```

2. Execute the SQL file:
```bash
docker exec -i <mysql-container-name> mysql -u root -p inventory_store < run-tax-fields-migration.sql
```

### Option 3: Direct SQL Execution

1. Copy the contents of `run-tax-fields-migration.sql`

2. Connect to your database using any MySQL client (phpMyAdmin, MySQL Workbench, etc.)

3. Paste and execute the SQL script

## Verify Migration

After running the migration, verify the columns exist:

```sql
DESCRIBE `Order`;
```

You should see:
- `taxRate` (DECIMAL(5,2), NULL)
- `taxableAmount` (DECIMAL(10,2), NULL)
- `taxAmount` (DECIMAL(10,2), NULL)

## Restart Application

After running the migration, restart your Docker containers:

```bash
cd /opt/inventory-store/apps/web
docker-compose restart app
```

## Notes

- The migration script is idempotent - it checks if columns exist before adding them, so it's safe to run multiple times
- The columns are nullable, so existing orders will have NULL values for these fields
- New orders created through the billing system will have these fields populated

