#!/bin/bash

# Script to perform a clean rebuild of the application on VPS
# This addresses stale cache issues and malicious code injection

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting clean rebuild process...${NC}"

# Navigate to app directory
cd "$(dirname "$0")" || exit 1

echo -e "${YELLOW}Step 1: Stopping containers...${NC}"
docker-compose down

echo -e "${YELLOW}Step 2: Pulling latest code...${NC}"
git pull origin main

echo -e "${YELLOW}Step 3: Removing suspicious files...${NC}"
# Remove any suspicious files that might contain malicious code
find . -name "*lrt*" -type f -delete 2>/dev/null || true
find . -name "*returnNaN*" -type f -delete 2>/dev/null || true
find .next -name "*.js" -type f -exec grep -l "returnNaN" {} \; -delete 2>/dev/null || true

echo -e "${YELLOW}Step 4: Clearing Next.js cache...${NC}"
rm -rf .next
rm -rf node_modules/.cache

echo -e "${YELLOW}Step 5: Clearing Docker build cache...${NC}"
docker system prune -f
docker builder prune -f

echo -e "${YELLOW}Step 6: Rebuilding application with --no-cache...${NC}"
docker-compose build --no-cache app

echo -e "${YELLOW}Step 7: Starting containers...${NC}"
docker-compose up -d

echo -e "${YELLOW}Step 8: Waiting for application to be healthy...${NC}"
sleep 10

# Check container health
if docker-compose ps | grep -q "healthy"; then
  echo -e "${GREEN}✓ Application is healthy!${NC}"
else
  echo -e "${YELLOW}⚠ Application may still be starting. Check logs with: docker-compose logs -f app${NC}"
fi

echo -e "${GREEN}✓ Clean rebuild completed!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Check logs: docker-compose logs -f app"
echo -e "  2. Verify no returnNaN errors appear"
echo -e "  3. Test login functionality"

