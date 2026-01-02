#!/bin/bash

# Script to run the purchase order item cost column migration
# This adds the cost and quotedCost columns to PurchaseOrderItem table if they don't exist

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Running PurchaseOrderItem cost column migration...${NC}"

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
  if [ ! -f "add-purchase-order-item-cost-migration.sql" ]; then
    echo -e "${RED}Error: Migration file 'add-purchase-order-item-cost-migration.sql' not found${NC}"
    exit 1
  fi
  
  # Copy migration file into container and execute
  docker cp add-purchase-order-item-cost-migration.sql "$MYSQL_CONTAINER:/tmp/migration.sql"
  
  echo -e "${YELLOW}Executing migration...${NC}"
  docker exec -i "$MYSQL_CONTAINER" mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < add-purchase-order-item-cost-migration.sql
  
  # Clean up
  docker exec "$MYSQL_CONTAINER" rm -f /tmp/migration.sql
  
  echo -e "${GREEN}Migration completed successfully!${NC}"
  
  # Verify the migration
  echo -e "${YELLOW}Verifying migration...${NC}"
  docker exec -i "$MYSQL_CONTAINER" mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" -e "
    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = '$MYSQL_DATABASE'
      AND TABLE_NAME = 'PurchaseOrderItem'
      AND COLUMN_NAME IN ('cost', 'quotedCost')
    ORDER BY COLUMN_NAME;
  "
  
else
  echo -e "${YELLOW}No Docker MySQL container detected. Using direct MySQL connection...${NC}"
  
  # Check if migration file exists
  if [ ! -f "add-purchase-order-item-cost-migration.sql" ]; then
    echo -e "${RED}Error: Migration file 'add-purchase-order-item-cost-migration.sql' not found${NC}"
    exit 1
  fi
  
  # Execute migration directly
  echo -e "${YELLOW}Executing migration...${NC}"
  mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < add-purchase-order-item-cost-migration.sql
  
  echo -e "${GREEN}Migration completed successfully!${NC}"
  
  # Verify the migration
  echo -e "${YELLOW}Verifying migration...${NC}"
  mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" -e "
    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = '$MYSQL_DATABASE'
      AND TABLE_NAME = 'PurchaseOrderItem'
      AND COLUMN_NAME IN ('cost', 'quotedCost')
    ORDER BY COLUMN_NAME;
  "
fi

echo -e "${GREEN}✓ Migration script completed!${NC}"

