#!/bin/bash

# WooPilot - Import CSV Data from LOVABLE
# This script imports CSV files exported from LOVABLE into the new Supabase

set -e  # Exit on error

# Configuration
NEW_SUPABASE_HOST="91.99.207.249"
NEW_SUPABASE_PORT="5432"
NEW_SUPABASE_DB="postgres"
NEW_SUPABASE_USER="postgres"
NEW_SUPABASE_PASSWORD=""  # ⚠️ SET THIS! (same as run-migrations.sh)

CSV_DIR="./csv-exports"  # Directory containing CSV files from LOVABLE

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "================================================"
echo "📦 WooPilot - CSV Data Import"
echo "================================================"
echo ""

# Check password
if [ -z "$NEW_SUPABASE_PASSWORD" ]; then
  echo -e "${RED}❌ ERROR: NEW_SUPABASE_PASSWORD is not set${NC}"
  echo "Edit this script and set your PostgreSQL password"
  exit 1
fi

# Check if CSV directory exists
if [ ! -d "$CSV_DIR" ]; then
  echo -e "${YELLOW}⚠️  CSV directory not found: $CSV_DIR${NC}"
  echo ""
  echo "Creating directory..."
  mkdir -p "$CSV_DIR"
  echo ""
  echo -e "${BLUE}Please place your CSV files exported from LOVABLE in:${NC}"
  echo "  $CSV_DIR/"
  echo ""
  echo "File naming convention:"
  echo "  - stores.csv"
  echo "  - products.csv"
  echo "  - orders.csv"
  echo "  - (etc.)"
  echo ""
  exit 1
fi

# Test connection
echo "Testing database connection..."
export PGPASSWORD="$NEW_SUPABASE_PASSWORD"

if ! psql -h "$NEW_SUPABASE_HOST" -p "$NEW_SUPABASE_PORT" -U "$NEW_SUPABASE_USER" -d "$NEW_SUPABASE_DB" -c "SELECT 1;" > /dev/null 2>&1; then
  echo -e "${RED}❌ Connection failed!${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Connected to database${NC}"
echo ""

# List of tables in order (respecting foreign key dependencies)
# IMPORTANT: This order matters! Parent tables must be imported before child tables
TABLES=(
  # 1. User & Store Management (no dependencies)
  "profiles"
  "stores"

  # 2. Store Users (depends on: stores, profiles)
  "user_roles"
  "store_users"

  # 3. Taxonomies (depends on: stores)
  "store_categories"
  "store_tags"
  "store_brands"
  "store_attributes"
  "store_attribute_terms"

  # 4. Products (depends on: stores, taxonomies)
  "products"
  "product_images"
  "product_variations"
  "product_attributes"

  # 5. Orders (depends on: stores)
  "orders"
  "order_status_logs"

  # 6. Webhooks (depends on: stores)
  "webhooks"
  "webhook_logs"

  # 7. Sync Logs (depends on: stores, products)
  "sync_logs"
  "sync_errors"
  "taxonomy_sync_log"

  # 8. Project Management (depends on: profiles, stores)
  "sprints"
  "tasks"
  "work_logs"
  "task_comments"
  "task_logs"
  "bug_reports"
  "deployments"
  "project_alerts"

  # 9. AI System (depends on: stores)
  "agent_insights"
  "agent_alerts"
  "agent_execution_log"

  # 10. Security/Audit (depends on: various)
  "credential_access_logs"
  "audit_logs"
  "anomaly_response_actions"
)

echo "Found CSV files:"
ls -lh "$CSV_DIR"/*.csv 2>/dev/null || echo "  (no CSV files yet)"
echo ""

# Counters
SUCCESS_COUNT=0
SKIPPED_COUNT=0
FAILED_COUNT=0
IMPORTED_ROWS=0

# Import each table
for table in "${TABLES[@]}"; do
  csv_file="$CSV_DIR/${table}.csv"

  if [ ! -f "$csv_file" ]; then
    echo -e "${YELLOW}⏭️  Skipping:${NC} $table (CSV not found)"
    ((SKIPPED_COUNT++))
    continue
  fi

  echo -e "${BLUE}Importing:${NC} $table"

  # Get row count from CSV (excluding header)
  row_count=$(($(wc -l < "$csv_file") - 1))
  echo "  Rows in CSV: $row_count"

  if [ $row_count -eq 0 ]; then
    echo -e "${YELLOW}  ⏭️  Empty file, skipping${NC}"
    ((SKIPPED_COUNT++))
    continue
  fi

  # Import CSV using COPY command
  # Note: This assumes CSV has headers and uses comma delimiter
  if psql -h "$NEW_SUPABASE_HOST" \
          -p "$NEW_SUPABASE_PORT" \
          -U "$NEW_SUPABASE_USER" \
          -d "$NEW_SUPABASE_DB" \
          -c "\\COPY $table FROM '$csv_file' WITH (FORMAT csv, HEADER true, DELIMITER ',');" \
          2>&1 | tee /tmp/import_output.log; then

    # Get actual imported row count
    imported=$(psql -h "$NEW_SUPABASE_HOST" \
                    -p "$NEW_SUPABASE_PORT" \
                    -U "$NEW_SUPABASE_USER" \
                    -d "$NEW_SUPABASE_DB" \
                    -t -c "SELECT COUNT(*) FROM $table;")

    echo -e "${GREEN}  ✅ Success - imported $imported rows${NC}"
    ((SUCCESS_COUNT++))
    ((IMPORTED_ROWS += imported))
  else
    echo -e "${RED}  ❌ Failed${NC}"
    cat /tmp/import_output.log
    ((FAILED_COUNT++))

    # Ask to continue
    read -p "Continue? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      break
    fi
  fi
  echo ""
done

# Summary
echo "================================================"
echo "📊 Import Summary"
echo "================================================"
echo "Total tables: ${#TABLES[@]}"
echo -e "${GREEN}Imported: $SUCCESS_COUNT${NC}"
echo -e "${YELLOW}Skipped: $SKIPPED_COUNT${NC}"
echo -e "${RED}Failed: $FAILED_COUNT${NC}"
echo "Total rows imported: $IMPORTED_ROWS"
echo ""

# Verify data
echo "================================================"
echo "🔍 Data Verification"
echo "================================================"
echo ""

echo "Row counts per table:"
for table in "${TABLES[@]}"; do
  count=$(psql -h "$NEW_SUPABASE_HOST" \
               -p "$NEW_SUPABASE_PORT" \
               -U "$NEW_SUPABASE_USER" \
               -d "$NEW_SUPABASE_DB" \
               -t -c "SELECT COUNT(*) FROM $table;" 2>/dev/null || echo "0")
  if [ "$count" -gt 0 ]; then
    echo "  $table: $count rows"
  fi
done

echo ""
if [ $FAILED_COUNT -eq 0 ]; then
  echo -e "${GREEN}✅ Import completed successfully!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Verify data integrity in Supabase Studio"
  echo "2. Deploy Edge Functions"
  echo "3. Deploy Frontend"
else
  echo -e "${RED}❌ Import completed with errors${NC}"
  echo "Please review failed imports above"
fi

echo "================================================"
