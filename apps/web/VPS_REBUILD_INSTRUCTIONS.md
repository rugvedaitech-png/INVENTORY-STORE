# VPS Rebuild Instructions After Migration

## Quick Fix for Git Merge Conflict

If you see an error about local changes, run these commands:

```bash
cd /opt/inventory-store/apps/web

# Option 1: Discard local changes (recommended - remote has latest)
git checkout -- apps/web/clean-rebuild-vps.sh
git pull origin main

# Option 2: Stash local changes (if you want to keep them)
# git stash
# git pull origin main
# git stash pop  # Only if you want to restore your changes

# Then run the rebuild
chmod +x rebuild-after-migration.sh
./rebuild-after-migration.sh
```

## Manual Rebuild Steps

If the script doesn't work, do it manually:

```bash
cd /opt/inventory-store/apps/web

# Fix git conflict
git checkout -- apps/web/clean-rebuild-vps.sh
git pull origin main

# Rebuild the app container
docker-compose stop app
docker-compose build --no-cache app
docker-compose up -d

# Check logs
docker-compose logs -f app
```

## What This Does

1. **Regenerates Prisma Client**: The rebuild will run `npx prisma generate` which creates a new Prisma client that matches your current database schema (without `costPaise`)

2. **Rebuilds Next.js App**: The `--no-cache` flag ensures a fresh build with all latest code changes

3. **Fixes Both Issues**:
   - Removes `costPaise` null constraint errors
   - Clears stale build cache (fixes `returnNaN` errors)

## Verification

After rebuild, test creating a purchase order. It should work without errors.

