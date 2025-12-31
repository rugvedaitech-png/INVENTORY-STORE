# Database Sync Instructions for VPS

## Overview
This document provides instructions for syncing the database on your VPS server after the currency migration changes.

## Prerequisites
- SSH access to your VPS server
- MySQL/MariaDB access with appropriate permissions
- Node.js and npm installed on VPS
- Git installed on VPS

## Steps to Sync Database

### 1. Connect to Your VPS
```bash
ssh your-user@your-vps-ip
```

### 2. Navigate to Project Directory
```bash
cd /path/to/inventory-store
```

### 3. Pull Latest Code
```bash
git pull origin main
```

### 4. Install Dependencies (if needed)
```bash
cd apps/web
npm install
```

### 5. Regenerate Prisma Client
```bash
npx prisma generate
```

### 6. Run Database Migrations

#### Option A: Using Prisma Migrate (Recommended)
```bash
npx prisma migrate deploy
```

This will automatically apply:
- Currency conversion migration (paise to rupees)
- Tax fields migration (adds taxRate, taxableAmount, taxAmount to Order table)

#### Option B: Manual SQL Execution (If migrate deploy fails)

If you need to run migrations manually, execute these SQL files in order:

1. **Currency Migration:**
```bash
mysql -u root -p your_database_name < apps/web/run-currency-migration.sql
```

2. **Tax Fields Migration:**
```bash
mysql -u root -p your_database_name < apps/web/run-tax-fields-migration.sql
```

### 7. Verify Migrations

#### Check Currency Fields
```sql
-- Verify Product prices are in rupees (should be small decimal values)
SELECT id, title, price, costPrice FROM Product LIMIT 5;

-- Verify Order amounts are in rupees
SELECT id, subtotal, discountAmount, totalAmount FROM `Order` LIMIT 5;
```

#### Check Tax Fields
```sql
-- Verify tax fields exist in Order table
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'Order'
  AND COLUMN_NAME IN ('taxRate', 'taxableAmount', 'taxAmount')
ORDER BY COLUMN_NAME;
```

### 8. Restart Application

Restart your application server to load the new code:

```bash
# If using PM2:
pm2 restart inventory-store

# If using systemd:
sudo systemctl restart inventory-store

# If using Docker:
docker-compose restart app
```

## Important Notes

### Data Backup
⚠️ **IMPORTANT:** Before running migrations, ensure you have a database backup:
```bash
mysqldump -u root -p your_database_name > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Migration Order
The migrations must be run in this order:
1. Currency conversion migration (converts paise to rupees)
2. Tax fields migration (adds tax columns)

### Rollback Plan
If you need to rollback:
1. Restore from database backup
2. Revert code: `git revert HEAD`
3. Regenerate Prisma client: `npx prisma generate`

## Troubleshooting

### Issue: Migration fails with "Unknown column"
**Solution:** Ensure you're running migrations in the correct order and that the Prisma schema matches your database.

### Issue: Prices still showing incorrectly
**Solution:** 
1. Clear browser cache
2. Verify database values are in rupees (not paise)
3. Check that Prisma client was regenerated

### Issue: Tax fields not found
**Solution:** Run the tax fields migration manually:
```bash
mysql -u root -p your_database_name < apps/web/run-tax-fields-migration.sql
```

## Verification Checklist

After syncing, verify:
- [ ] All product prices display correctly in rupees (e.g., ₹375.00, not ₹3.75)
- [ ] Order totals are correct
- [ ] Tax calculations work in billing module
- [ ] Purchase orders show correct costs
- [ ] Reports show correct revenue amounts
- [ ] Customer-facing pages show correct prices

## Support

If you encounter issues, check:
1. Database connection string in `.env`
2. Prisma schema matches database structure
3. All migrations have been applied
4. Application logs for errors

