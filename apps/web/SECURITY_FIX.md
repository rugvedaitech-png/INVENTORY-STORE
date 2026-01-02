# Security and Error Fix Guide

## Critical Issues Identified

1. **`ReferenceError: returnNaN is not defined`** - This error indicates cached/compiled code on the VPS contains references to a non-existent function
2. **Malicious Script Activity** - The logs show attempts to execute malicious scripts (`/tmp/cc.txt`, `/tmp/javae`, etc.) which suggests:
   - Container compromise
   - Potential security vulnerability
   - Unauthorized code execution

## Root Causes

1. **Cached Code**: Next.js build cache contains old compiled code with references to `returnNaN`
2. **Container Security**: The container appears to have been compromised or is vulnerable to code injection
3. **Stale Build Artifacts**: Docker build cache may contain compromised or outdated code

## Fix Steps (Run on VPS)

### Option 1: Automated Fix Script

```bash
cd /opt/inventory-store/apps/web
chmod +x fix-vps-issues.sh
./fix-vps-issues.sh
```

### Option 2: Manual Steps

```bash
cd /opt/inventory-store/apps/web

# 1. Stop containers
docker-compose down

# 2. Pull latest code
git pull origin main

# 3. Remove malicious files (if any)
docker-compose exec -T app sh -c "rm -f /tmp/cc.txt /tmp/javae /tmp/lok /tmp/kdevtmpfsi" || true

# 4. Clear all caches
rm -rf .next
rm -rf node_modules/.cache
rm -rf .swc

# 5. Clear Docker caches
docker system prune -f
docker builder prune -f

# 6. Remove old images
docker-compose down --rmi local

# 7. Rebuild from scratch
docker-compose build --no-cache --pull

# 8. Start containers
docker-compose up -d

# 9. Monitor logs
docker-compose logs -f app
```

## Security Recommendations

1. **Immediate Actions**:
   - Rebuild containers from scratch
   - Review container logs for unauthorized access
   - Check for any exposed ports or services
   - Review Dockerfile for security best practices

2. **Ongoing Security**:
   - Regularly update base images
   - Use non-root user in containers
   - Implement resource limits
   - Monitor container logs for suspicious activity
   - Use Docker secrets for sensitive data

3. **Code Security**:
   - Review all `parseInt`/`parseFloat` usage
   - Ensure all parsing functions handle NaN properly
   - Use `safeParseInt` and `safeParseFloat` from `@/lib/utils`

## Verification

After applying fixes, verify:

1. No `returnNaN` errors in logs:
   ```bash
   docker-compose logs app | grep -i "returnNaN" || echo "No returnNaN errors found"
   ```

2. No malicious processes:
   ```bash
   docker-compose exec app ps aux | grep -E '(cc.txt|javae|lok)' || echo "No malicious processes"
   ```

3. Application is healthy:
   ```bash
   docker-compose ps
   curl http://localhost:3000/api/health || echo "Health check endpoint not available"
   ```

## If Issues Persist

1. **Complete Container Rebuild**:
   ```bash
   docker-compose down -v  # Remove volumes too
   docker system prune -a -f  # Remove all unused images
   docker-compose build --no-cache
   docker-compose up -d
   ```

2. **Check for Code Injection**:
   - Review all API routes for input validation
   - Check for eval() or Function() usage
   - Review file upload endpoints
   - Check environment variables

3. **Contact Security Team**:
   - If malicious activity continues
   - If unauthorized access is confirmed
   - If data breach is suspected

