#!/bin/bash

# Quick rebuild script after database migrations
# This regenerates Prisma client and rebuilds the app with latest code

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Rebuilding application after database migration...${NC}"

# Navigate to app directory
cd "$(dirname "$0")" || exit 1

echo -e "${YELLOW}Step 1: Pulling latest code...${NC}"
git pull origin main

echo -e "${YELLOW}Step 2: Stopping app container...${NC}"
docker-compose stop app

echo -e "${YELLOW}Step 3: Rebuilding app container (regenerates Prisma client)...${NC}"
docker-compose build --no-cache app

echo -e "${YELLOW}Step 4: Starting containers...${NC}"
docker-compose up -d

echo -e "${YELLOW}Step 5: Waiting for application to be healthy...${NC}"
sleep 10

# Check container health
if docker-compose ps | grep -q "healthy"; then
  echo -e "${GREEN}✓ Application is healthy!${NC}"
else
  echo -e "${YELLOW}⚠ Application may still be starting. Check logs with: docker-compose logs -f app${NC}"
fi

echo -e "${GREEN}✓ Rebuild completed!${NC}"
echo -e "${YELLOW}Check logs: docker-compose logs -f app${NC}"

