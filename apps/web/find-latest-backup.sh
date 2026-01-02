#!/bin/bash
# Script to find the most recent SQL backup file

set -e

echo "=========================================="
echo "Finding Latest SQL Backup File"
echo "=========================================="
echo ""

cd "$(dirname "$0")" || exit 1

echo "Searching for SQL backup files..."
echo ""

# Find all SQL files that might be backups
# Look for files with "backup", "dump", or date patterns in the name
BACKUP_FILES=$(find . -maxdepth 2 -type f \( -name "*.sql" -o -name "*backup*.sql" -o -name "*dump*.sql" \) 2>/dev/null | sort)

if [ -z "$BACKUP_FILES" ]; then
    echo "❌ No SQL backup files found in current directory"
    echo ""
    echo "Searching in parent directories..."
    BACKUP_FILES=$(find .. -maxdepth 3 -type f \( -name "*.sql" -o -name "*backup*.sql" -o -name "*dump*.sql" \) 2>/dev/null | sort)
fi

if [ -z "$BACKUP_FILES" ]; then
    echo "❌ No SQL backup files found"
    exit 1
fi

echo "Found SQL files:"
echo "----------------------------------------"
LATEST_FILE=""
LATEST_DATE=""

while IFS= read -r file; do
    if [ -f "$file" ]; then
        # Get file modification date
        if command -v stat >/dev/null 2>&1; then
            # Linux stat
            FILE_DATE=$(stat -c %y "$file" 2>/dev/null | cut -d' ' -f1 || echo "unknown")
            FILE_TIME=$(stat -c %y "$file" 2>/dev/null | cut -d' ' -f2 | cut -d'.' -f1 || echo "")
        else
            # macOS stat
            FILE_DATE=$(stat -f "%Sm" -t "%Y-%m-%d" "$file" 2>/dev/null || echo "unknown")
            FILE_TIME=$(stat -f "%Sm" -t "%H:%M:%S" "$file" 2>/dev/null || echo "")
        fi
        
        FILE_SIZE=$(du -h "$file" 2>/dev/null | cut -f1)
        FILE_NAME=$(basename "$file")
        
        # Check if filename contains a date pattern (YYYYMMDD)
        if [[ "$FILE_NAME" =~ ([0-9]{8}) ]]; then
            FILE_DATE_PATTERN="${BASH_REMATCH[1]}"
            echo "📅 $FILE_NAME"
            echo "   Date in filename: ${FILE_DATE_PATTERN:0:4}-${FILE_DATE_PATTERN:4:2}-${FILE_DATE_PATTERN:6:2}"
        else
            echo "📄 $FILE_NAME"
        fi
        
        echo "   Modified: $FILE_DATE $FILE_TIME"
        echo "   Size: $FILE_SIZE"
        echo "   Path: $file"
        echo ""
        
        # Track latest file
        if [ -z "$LATEST_FILE" ] || [ "$file" -nt "$LATEST_FILE" ]; then
            LATEST_FILE="$file"
            LATEST_DATE="$FILE_DATE $FILE_TIME"
        fi
    fi
done <<< "$BACKUP_FILES"

echo "=========================================="
if [ -n "$LATEST_FILE" ]; then
    LATEST_SIZE=$(du -h "$LATEST_FILE" 2>/dev/null | cut -f1)
    echo "✅ LATEST BACKUP FOUND:"
    echo "   File: $(basename "$LATEST_FILE")"
    echo "   Path: $LATEST_FILE"
    echo "   Date: $LATEST_DATE"
    echo "   Size: $LATEST_SIZE"
    echo ""
    echo "To restore this backup:"
    echo "   docker-compose exec -T mysql mysql -uinventory_user -pinventory_password inventory_store < $LATEST_FILE"
else
    echo "❌ Could not determine latest backup"
fi
echo "=========================================="
echo ""

# Also check for files with today's date or recent dates
echo "Checking for backups from today or recent dates..."
TODAY=$(date +%Y%m%d)
YESTERDAY=$(date -d "yesterday" +%Y%m%d 2>/dev/null || date -v-1d +%Y%m%d 2>/dev/null || echo "")

RECENT_FILES=$(find . -maxdepth 2 -type f -name "*${TODAY}*.sql" -o -name "*${YESTERDAY}*.sql" 2>/dev/null || true)

if [ -n "$RECENT_FILES" ]; then
    echo "✅ Found recent backups:"
    echo "$RECENT_FILES"
else
    echo "   No backups from today or yesterday found"
fi

echo ""
echo "Checking common backup locations..."
BACKUP_DIRS=(
    "/opt/backups"
    "/var/backups"
    "/root/backups"
    "$HOME/backups"
    "./backups"
    "../backups"
)

for dir in "${BACKUP_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        FOUND=$(find "$dir" -maxdepth 1 -type f -name "*.sql" 2>/dev/null | head -5)
        if [ -n "$FOUND" ]; then
            echo "✅ Found backups in: $dir"
            echo "$FOUND" | while read -r f; do
                SIZE=$(du -h "$f" 2>/dev/null | cut -f1)
                DATE=$(stat -c %y "$f" 2>/dev/null | cut -d' ' -f1 || stat -f "%Sm" -t "%Y-%m-%d" "$f" 2>/dev/null || echo "unknown")
                echo "   - $(basename "$f") ($SIZE, $DATE)"
            done
        fi
    fi
done

echo ""

