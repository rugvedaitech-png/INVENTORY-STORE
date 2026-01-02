# VPS Fix Instructions

## Issues Identified

1. **Missing `cost` column in `PurchaseOrderItem` table** - Causing Prisma errors when creating purchase orders
2. **`ReferenceError: returnNaN is not defined`** - Stale build cache or malicious code injection
3. **Suspicious file access attempts** - `/dev/lrt` access errors suggest potential security issue

## Fix Steps

### Step 1: Run Database Migration

The `cost` column is missing from the `PurchaseOrderItem` table. Run the migration:

```bash
cd /opt/inventory-store/apps/web
chmod +x run-purchase-order-cost-migration.sh
./run-purchase-order-cost-migration.sh
```

This will:
- Add the `cost` column if it doesn't exist
- Add the `quotedCost` column if it doesn't exist
- Verify the migration was successful

### Step 2: Clean Rebuild Application

To fix the `returnNaN` errors and remove any malicious code:

```bash
cd /opt/inventory-store/apps/web
chmod +x clean-rebuild-vps.sh
./clean-rebuild-vps.sh
```

This script will:
- Stop all containers
- Pull latest code from git
- Remove suspicious files
- Clear Next.js and Docker caches
- Rebuild the app with `--no-cache` (ensures clean build)
- Restart containers

### Step 3: Verify Fix

After the rebuild, check the logs:

```bash
docker-compose logs -f app
```

Look for:
- ✅ No `returnNaN` errors
- ✅ No `/dev/lrt` access errors
- ✅ Application starts successfully
- ✅ Purchase orders can be created without errors

### Step 4: Test Functionality

1. **Test Login**: Try logging in - should work without 403 errors (fixed with `trustHost: true`)
2. **Test Purchase Orders**: Create a new purchase order - should work without `cost` column errors
3. **Test Bulk Upload**: Try bulk upload feature - should work correctly

## Manual Steps (if scripts fail)

If the automated scripts don't work, follow these manual steps:

### Manual Migration

```bash
cd /opt/inventory-store/apps/web

# Find MySQL container
MYSQL_CONTAINER=$(docker ps --format "{{.Names}}" | grep -i mysql | head -n 1)

# Copy and run migration
docker cp add-purchase-order-item-cost-migration.sql "$MYSQL_CONTAINER:/tmp/migration.sql"
docker exec -i "$MYSQL_CONTAINER" mysql -uinventory_user -pinventory_password inventory_store < add-purchase-order-item-cost-migration.sql
```

### Manual Clean Rebuild

```bash
cd /opt/inventory-store/apps/web

# Stop containers
docker-compose down

# Pull latest code
git pull origin main

# Remove caches
rm -rf .next
rm -rf node_modules/.cache

# Remove suspicious files
find . -name "*lrt*" -type f -delete 2>/dev/null || true
find .next -name "*.js" -type f -exec grep -l "returnNaN" {} \; -delete 2>/dev/null || true

# Clear Docker cache
docker system prune -f
docker builder prune -f

# Rebuild and restart
docker-compose build --no-cache app
docker-compose up -d

# Check logs
docker-compose logs -f app
```

## Security Recommendations

1. **Review Logs**: Check for any suspicious activity
2. **Change Passwords**: Consider rotating database and application passwords
3. **Firewall**: Ensure only necessary ports are exposed
4. **Updates**: Keep Docker and system packages updated
5. **Monitoring**: Set up monitoring for unusual file access patterns

## Expected Results

After completing these steps:
- ✅ Purchase orders can be created successfully
- ✅ No `returnNaN` errors in logs
- ✅ No suspicious file access errors
- ✅ Login works correctly (403 error fixed)
- ✅ Application runs smoothly

## Troubleshooting

If issues persist:

1. **Check container health**: `docker-compose ps`
2. **View detailed logs**: `docker-compose logs --tail=100 app`
3. **Verify database connection**: `docker-compose exec mysql mysql -uinventory_user -pinventory_password inventory_store -e "SHOW TABLES;"`
4. **Check disk space**: `df -h`
5. **Check memory**: `free -h`

