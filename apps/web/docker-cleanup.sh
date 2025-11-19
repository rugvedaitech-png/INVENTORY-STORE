#!/bin/bash

# Docker Cleanup Script
# This script removes unused Docker images and build cache to free up disk space
# Run this script periodically via cron job

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Log file location
LOG_FILE="/var/log/docker-cleanup.log"

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
    log_message "[INFO] $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
    log_message "[WARNING] $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    log_message "[ERROR] $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Exiting."
    exit 1
fi

print_status "Starting Docker cleanup process..."

# Get disk usage before cleanup
DISK_USAGE_BEFORE=$(docker system df | grep -E "Images|Build Cache" | awk '{sum+=$4} END {print sum}')
print_status "Disk usage before cleanup: $(docker system df --format 'table {{.Type}}\t{{.TotalCount}}\t{{.Size}}\t{{.Reclaimable}}')"

# Remove unused images (images not associated with any container)
print_status "Removing unused Docker images..."
if docker image prune -a -f > /dev/null 2>&1; then
    print_status "Unused images removed successfully"
else
    print_warning "No unused images to remove or error occurred"
fi

# Remove build cache
print_status "Removing Docker build cache..."
if docker builder prune -a -f > /dev/null 2>&1; then
    print_status "Build cache removed successfully"
else
    print_warning "No build cache to remove or error occurred"
fi

# Optional: Remove unused volumes (commented out by default to prevent data loss)
# Uncomment the following lines if you want to remove unused volumes as well
# print_status "Removing unused Docker volumes..."
# if docker volume prune -f > /dev/null 2>&1; then
#     print_status "Unused volumes removed successfully"
# else
#     print_warning "No unused volumes to remove or error occurred"
# fi

# Get disk usage after cleanup
DISK_USAGE_AFTER=$(docker system df | grep -E "Images|Build Cache" | awk '{sum+=$4} END {print sum}')
print_status "Disk usage after cleanup: $(docker system df --format 'table {{.Type}}\t{{.TotalCount}}\t{{.Size}}\t{{.Reclaimable}}')"

# Calculate space reclaimed
RECLAIMED=$(docker system df | grep "RECLAIMABLE" | awk '{print $4}' | head -1)
print_status "Space reclaimed: $RECLAIMED"

print_status "Docker cleanup completed successfully!"

