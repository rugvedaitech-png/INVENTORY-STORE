#!/bin/bash

# Script to remove old costPaise columns from PurchaseOrderItem table
# These columns are no longer used after migration to Decimal cost/quotedCost

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Removing old costPaise columns from PurchaseOrderItem...${NC}"

# Get MySQL credentials from environment or use defaults
MYSQL_USER="${MYSQL_USER:-inventory_user}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-inventory_password}"
MYSQL_DATABASE="${MYSQL_DATABASE:-inventory_store}"

# Check if running in Docker environment
if command -v docker &> /dev/null && docker ps | grep -q mysql; then
  echo -e "${YELLOW}Detected Docker MySQL container. Using docker exec...${NC}"
  
  # Find MySQL container name
  MYSQL_CONTAINER=$(docker ps --format "{{.Names}}" | grep -i mysql | head -n 1)
  
  if [ -z "$MYSQL_CONTAINER" ]; then
    echo -e "${RED}Error: MySQL container not found${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}Found MySQL container: $MYSQL_CONTAINER${NC}"
  
  # Check if migration file exists
  if [ ! -f "remove-old-costpaise-columns-migration.sql" ]; then
    echo -e "${RED}Error: Migration file 'remove-old-costpaise-columns-migration.sql' not found${NC}"
    exit 1
  fi
  
  # Copy migration file into container and execute
  docker cp remove-old-costpaise-columns-migration.sql "$MYSQL_CONTAINER:/tmp/migration.sql"
  
  echo -e "${YELLOW}Executing migration...${NC}"
  docker exec -i "$MYSQL_CONTAINER" mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < remove-old-costpaise-columns-migration.sql
  
  # Clean up
  docker exec "$MYSQL_CONTAINER" rm -f /tmp/migration.sql
  
  echo -e "${GREEN}Migration completed successfully!${NC}"
  
  # Verify the migration
  echo -e "${YELLOW}Verifying migration...${NC}"
  docker exec -i "$MYSQL_CONTAINER" mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" -e "
    DESCRIBE PurchaseOrderItem;
  "
  
else
  echo -e "${YELLOW}No Docker MySQL container detected. Using direct MySQL connection...${NC}"
  
  # Check if migration file exists
  if [ ! -f "remove-old-costpaise-columns-migration.sql" ]; then
    echo -e "${RED}Error: Migration file 'remove-old-costpaise-columns-migration.sql' not found${NC}"
    exit 1
  fi
  
  # Execute migration directly
  echo -e "${YELLOW}Executing migration...${NC}"
  mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < remove-old-costpaise-columns-migration.sql
  
  echo -e "${GREEN}Migration completed successfully!${NC}"
  
  # Verify the migration
  echo -e "${YELLOW}Verifying migration...${NC}"
  mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" -e "
    DESCRIBE PurchaseOrderItem;
  "
fi

echo -e "${GREEN}✓ Migration script completed!${NC}"

