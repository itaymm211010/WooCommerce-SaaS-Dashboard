#!/bin/bash

# WooPilot - Run All 48 Migrations on New Supabase
# This script executes all migration files in chronological order

set -e  # Exit on error

# Configuration
NEW_SUPABASE_HOST="91.99.207.249"
NEW_SUPABASE_PORT="5432"
NEW_SUPABASE_DB="postgres"
NEW_SUPABASE_USER="postgres"
NEW_SUPABASE_PASSWORD=""  # ⚠️ SET THIS! (from Coolify env vars)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "================================================"
echo "🚀 WooPilot - Database Schema Migration"
echo "================================================"
echo ""

# Check if password is set
if [ -z "$NEW_SUPABASE_PASSWORD" ]; then
  echo -e "${RED}❌ ERROR: NEW_SUPABASE_PASSWORD is not set${NC}"
  echo ""
  echo "To find your password:"
  echo "1. Go to Coolify Dashboard"
  echo "2. Open WooPilot project → Supabase service"
  echo "3. Click 'Environment Variables'"
  echo "4. Copy the value of POSTGRES_PASSWORD"
  echo ""
  echo "Then edit this script and set:"
  echo "NEW_SUPABASE_PASSWORD=\"your-password-here\""
  exit 1
fi

# Test connection
echo "Testing database connection..."
export PGPASSWORD="$NEW_SUPABASE_PASSWORD"

if ! psql -h "$NEW_SUPABASE_HOST" -p "$NEW_SUPABASE_PORT" -U "$NEW_SUPABASE_USER" -d "$NEW_SUPABASE_DB" -c "SELECT 1;" > /dev/null 2>&1; then
  echo -e "${RED}❌ Connection failed!${NC}"
  echo "Please check:"
  echo "  - Host: $NEW_SUPABASE_HOST"
  echo "  - Port: $NEW_SUPABASE_PORT"
  echo "  - User: $NEW_SUPABASE_USER"
  echo "  - Password: (check if correct)"
  exit 1
fi

echo -e "${GREEN}✅ Connection successful!${NC}"
echo ""

# Get migration files sorted by timestamp (chronological order)
MIGRATION_DIR="/home/user/WooCommerce-SaaS-Dashboard/supabase/migrations"
MIGRATIONS=($(ls -1 "$MIGRATION_DIR"/*.sql | sort))

echo "Found ${#MIGRATIONS[@]} migration files"
echo ""

# Counter
SUCCESS_COUNT=0
FAILED_COUNT=0
FAILED_FILES=()

# Run each migration
for migration_file in "${MIGRATIONS[@]}"; do
  filename=$(basename "$migration_file")
  echo -e "${YELLOW}Running:${NC} $filename"

  if psql -h "$NEW_SUPABASE_HOST" \
          -p "$NEW_SUPABASE_PORT" \
          -U "$NEW_SUPABASE_USER" \
          -d "$NEW_SUPABASE_DB" \
          -f "$migration_file" \
          -v ON_ERROR_STOP=1 \
          --quiet 2>&1 | tee /tmp/migration_output.log; then
    echo -e "${GREEN}  ✅ Success${NC}"
    ((SUCCESS_COUNT++))
  else
    echo -e "${RED}  ❌ Failed${NC}"
    ((FAILED_COUNT++))
    FAILED_FILES+=("$filename")

    # Show error details
    echo -e "${RED}Error details:${NC}"
    cat /tmp/migration_output.log
    echo ""

    # Ask user if they want to continue
    read -p "Continue with remaining migrations? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      echo "Migration stopped by user."
      break
    fi
  fi
  echo ""
done

# Summary
echo "================================================"
echo "📊 Migration Summary"
echo "================================================"
echo -e "Total migrations: ${#MIGRATIONS[@]}"
echo -e "${GREEN}Successful: $SUCCESS_COUNT${NC}"
echo -e "${RED}Failed: $FAILED_COUNT${NC}"
echo ""

if [ $FAILED_COUNT -gt 0 ]; then
  echo -e "${RED}Failed migrations:${NC}"
  for failed_file in "${FAILED_FILES[@]}"; do
    echo "  - $failed_file"
  done
  echo ""
fi

# Verify schema
echo "================================================"
echo "🔍 Verifying Database Schema"
echo "================================================"
echo ""

echo "Tables created:"
psql -h "$NEW_SUPABASE_HOST" \
     -p "$NEW_SUPABASE_PORT" \
     -U "$NEW_SUPABASE_USER" \
     -d "$NEW_SUPABASE_DB" \
     -c "SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;" \
     --quiet

echo ""
echo "Total tables:"
TABLE_COUNT=$(psql -h "$NEW_SUPABASE_HOST" \
                   -p "$NEW_SUPABASE_PORT" \
                   -U "$NEW_SUPABASE_USER" \
                   -d "$NEW_SUPABASE_DB" \
                   -t -c "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';")
echo "  $TABLE_COUNT tables (expected: 32)"

echo ""
echo "Total RLS policies:"
RLS_COUNT=$(psql -h "$NEW_SUPABASE_HOST" \
                 -p "$NEW_SUPABASE_PORT" \
                 -U "$NEW_SUPABASE_USER" \
                 -d "$NEW_SUPABASE_DB" \
                 -t -c "SELECT COUNT(*) FROM pg_policies;")
echo "  $RLS_COUNT policies (expected: 100+)"

echo ""
echo "Total functions:"
FUNC_COUNT=$(psql -h "$NEW_SUPABASE_HOST" \
                  -p "$NEW_SUPABASE_PORT" \
                  -U "$NEW_SUPABASE_USER" \
                  -d "$NEW_SUPABASE_DB" \
                  -t -c "SELECT COUNT(*) FROM pg_proc WHERE pronamespace = 'public'::regnamespace;")
echo "  $FUNC_COUNT functions (expected: 13)"

echo ""
if [ $FAILED_COUNT -eq 0 ]; then
  echo -e "${GREEN}✅ Migration completed successfully!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Import CSV data: ./scripts/import-csv.sh"
  echo "2. Deploy Edge Functions"
  echo "3. Deploy Frontend"
else
  echo -e "${YELLOW}⚠️  Migration completed with errors.${NC}"
  echo "Please review the failed migrations above."
fi

echo "================================================"
