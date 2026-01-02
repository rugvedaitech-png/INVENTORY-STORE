# Fix 504 Gateway Timeout Error

## Common Causes

1. **App container not responding** - Container crashed or stuck
2. **Database connection timeout** - MySQL not accessible
3. **Nginx timeout too short** - Default 60s may not be enough for some requests
4. **Memory/resource exhaustion** - Container running out of resources
5. **Long-running requests** - API calls taking too long

## Quick Fix Steps

### Step 1: Diagnose the Issue

Run the diagnostic script on your VPS:

```bash
cd /opt/inventory-store/apps/web
chmod +x diagnose-504.sh
./diagnose-504.sh
```

### Step 2: Check Container Status

```bash
docker-compose ps
docker-compose logs --tail=100 app
```

### Step 3: Restart Containers

```bash
docker-compose restart
# Or if that doesn't work:
docker-compose down
docker-compose up -d
```

### Step 4: Apply Nginx Timeout Fix

The nginx configuration has been updated with proper timeout settings. After pulling the latest code:

```bash
cd /opt/inventory-store/apps/web
git pull origin main
docker-compose restart nginx
```

### Step 5: Check Application Health

```bash
# Test app directly (bypassing nginx)
docker-compose exec app curl http://localhost:3000/api/health

# Check if app is responding
curl http://localhost:3000
```

## Permanent Fixes Applied

1. **Nginx Timeout Settings**: Added `proxy_connect_timeout`, `proxy_send_timeout`, and `proxy_read_timeout` set to 60 seconds
2. **Diagnostic Script**: Created `diagnose-504.sh` to quickly identify issues

## If Problem Persists

### Check for Memory Issues

```bash
docker stats --no-stream
```

If memory usage is high (>90%), consider:
- Restarting containers
- Increasing container memory limits
- Checking for memory leaks in application

### Check Database Connection

```bash
docker-compose exec app sh -c "timeout 5 nc -zv mysql 3306"
```

If database is not reachable:
```bash
docker-compose restart mysql
docker-compose logs mysql
```

### Check for Application Errors

```bash
docker-compose logs app | grep -iE "(error|exception|timeout|failed)"
```

### Increase Timeout Further (if needed)

Edit `nginx.conf` and increase timeout values:

```nginx
proxy_connect_timeout 120s;
proxy_send_timeout 120s;
proxy_read_timeout 120s;
```

Then restart nginx:
```bash
docker-compose restart nginx
```

## Prevention

1. **Monitor container health**: Set up monitoring for container status
2. **Database connection pooling**: Ensure proper connection pool settings
3. **Optimize slow queries**: Check for slow database queries
4. **Resource limits**: Set appropriate memory/CPU limits in docker-compose.yml

## Emergency Recovery

If the application is completely down:

```bash
cd /opt/inventory-store/apps/web

# Stop everything
docker-compose down

# Clear any stuck processes
docker system prune -f

# Restart
docker-compose up -d

# Monitor logs
docker-compose logs -f app
```

