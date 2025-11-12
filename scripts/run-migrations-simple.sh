#!/bin/bash

# WooPilot - Run All 48 Migrations
# Simple version for direct execution

# ⚠️ EDIT THIS LINE - Add your PostgreSQL password from Coolify:
PGPASSWORD=""

if [ -z "$PGPASSWORD" ]; then
  echo "❌ ERROR: PGPASSWORD is empty!"
  echo ""
  echo "Edit this file and set PGPASSWORD at line 6"
  echo "Find password: Coolify Dashboard → WooPilot → Supabase → Environment Variables → POSTGRES_PASSWORD"
  exit 1
fi

export PGPASSWORD

HOST="91.99.207.249"
PORT="5432"
USER="postgres"
DB="postgres"

echo "================================================"
echo "🚀 WooPilot - Running Migrations"
echo "================================================"
echo ""

# Test connection
echo "Testing connection..."
if ! psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DB" -c "SELECT 1;" >/dev/null 2>&1; then
  echo "❌ Connection failed!"
  echo "Check password and that PostgreSQL is running"
  exit 1
fi

echo "✅ Connected!"
echo ""

# Run migrations
MIGRATION_DIR="/home/user/WooCommerce-SaaS-Dashboard/supabase/migrations"
COUNT=0
SUCCESS=0

for file in "$MIGRATION_DIR"/*.sql; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    echo "Running: $filename"

    if psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DB" -f "$file" -v ON_ERROR_STOP=1 --quiet 2>&1; then
      echo "  ✅ Success"
      ((SUCCESS++))
    else
      echo "  ❌ Failed"
    fi
    ((COUNT++))
    echo ""
  fi
done

echo "================================================"
echo "📊 Summary: $SUCCESS/$COUNT migrations succeeded"
echo "================================================"

# Show tables
echo ""
echo "Tables created:"
psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DB" -c "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;" --quiet

echo ""
echo "✅ Done! Next: ./scripts/import-csv.sh"
