#!/bin/bash

# ============================================================================
# WooCommerce SaaS Dashboard - Database Import Script
# ============================================================================
# Purpose: Import database backup to new Supabase on Coolify
# Usage:   ./import-to-new-supabase.sh <backup-file.sql.gz>
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
NEW_SUPABASE_HOST="your-hetzner-ip"  # ⚠️ SET THIS!
NEW_SUPABASE_PORT="5432"
NEW_SUPABASE_DB="postgres"
NEW_SUPABASE_USER="postgres"
NEW_SUPABASE_PASSWORD=""  # ⚠️ SET THIS! From Coolify

# ============================================================================
# Functions
# ============================================================================

print_header() {
    echo -e "${GREEN}"
    echo "============================================================================"
    echo "  WooCommerce SaaS - Database Import"
    echo "============================================================================"
    echo -e "${NC}"
}

print_step() {
    echo -e "${YELLOW}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

check_prerequisites() {
    print_step "Checking prerequisites..."

    # Check if backup file provided
    if [ -z "$1" ]; then
        print_error "No backup file specified!"
        echo "Usage: $0 <backup-file.sql.gz>"
        exit 1
    fi

    BACKUP_FILE="$1"

    # Check if backup file exists
    if [ ! -f "$BACKUP_FILE" ]; then
        print_error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi
    print_success "Backup file found: $BACKUP_FILE"

    # Check if psql is installed
    if ! command -v psql &> /dev/null; then
        print_error "psql not found!"
        echo "Install PostgreSQL client:"
        echo "  Ubuntu/Debian: sudo apt-get install postgresql-client"
        echo "  macOS:         brew install postgresql"
        exit 1
    fi
    print_success "psql found"

    # Check if gunzip is installed
    if ! command -v gunzip &> /dev/null; then
        print_error "gunzip not found!"
        exit 1
    fi
    print_success "gunzip found"

    # Check if connection details are set
    if [ -z "$NEW_SUPABASE_PASSWORD" ]; then
        print_error "Database password not set!"
        echo "Please edit this script and set NEW_SUPABASE_PASSWORD"
        exit 1
    fi
    print_success "Connection details configured"
}

test_connection() {
    print_step "Testing connection to new Supabase..."

    export PGPASSWORD="$NEW_SUPABASE_PASSWORD"

    if psql \
        --host="$NEW_SUPABASE_HOST" \
        --port="$NEW_SUPABASE_PORT" \
        --username="$NEW_SUPABASE_USER" \
        --dbname="$NEW_SUPABASE_DB" \
        --command="SELECT version();" > /dev/null 2>&1; then
        print_success "Connection successful"
    else
        print_error "Cannot connect to database!"
        echo "Check your connection details:"
        echo "  Host: $NEW_SUPABASE_HOST"
        echo "  Port: $NEW_SUPABASE_PORT"
        echo "  Database: $NEW_SUPABASE_DB"
        echo "  User: $NEW_SUPABASE_USER"
        exit 1
    fi

    unset PGPASSWORD
}

decompress_backup() {
    print_step "Decompressing backup..."

    TEMP_SQL=$(mktemp)
    gunzip -c "$BACKUP_FILE" > "$TEMP_SQL"

    print_success "Backup decompressed to: $TEMP_SQL"
}

import_database() {
    print_step "Importing database..."
    echo "⚠️  This will overwrite existing data in the database!"
    echo ""
    read -p "Continue? (yes/no): " confirm

    if [ "$confirm" != "yes" ]; then
        print_error "Import cancelled by user"
        rm -f "$TEMP_SQL"
        exit 0
    fi

    export PGPASSWORD="$NEW_SUPABASE_PASSWORD"

    psql \
        --host="$NEW_SUPABASE_HOST" \
        --port="$NEW_SUPABASE_PORT" \
        --username="$NEW_SUPABASE_USER" \
        --dbname="$NEW_SUPABASE_DB" \
        --file="$TEMP_SQL" \
        --quiet \
        2>&1 | grep -v "NOTICE"  # Suppress notices

    unset PGPASSWORD

    print_success "Database imported successfully"
}

verify_import() {
    print_step "Verifying import..."

    export PGPASSWORD="$NEW_SUPABASE_PASSWORD"

    echo ""
    echo "Table counts:"
    psql \
        --host="$NEW_SUPABASE_HOST" \
        --port="$NEW_SUPABASE_PORT" \
        --username="$NEW_SUPABASE_USER" \
        --dbname="$NEW_SUPABASE_DB" \
        --tuples-only \
        --command="
            SELECT
                schemaname || '.' || tablename AS table_name,
                n_live_tup AS row_count
            FROM pg_stat_user_tables
            WHERE schemaname IN ('public', 'storage')
            ORDER BY n_live_tup DESC;
        " | head -20

    unset PGPASSWORD

    echo ""
    print_success "Import verification complete"
}

cleanup() {
    print_step "Cleaning up..."
    rm -f "$TEMP_SQL"
    print_success "Temporary files removed"
}

show_summary() {
    echo ""
    echo -e "${GREEN}"
    echo "============================================================================"
    echo "  Import Completed Successfully!"
    echo "============================================================================"
    echo -e "${NC}"
    echo "Database: $NEW_SUPABASE_HOST:$NEW_SUPABASE_PORT/$NEW_SUPABASE_DB"
    echo "Date:     $(date)"
    echo ""
    echo "Next Steps:"
    echo "  1. Test the database: psql -h $NEW_SUPABASE_HOST -U $NEW_SUPABASE_USER -d $NEW_SUPABASE_DB"
    echo "  2. Deploy Edge Functions: cd supabase/functions && supabase functions deploy"
    echo "  3. Update Frontend .env: VITE_SUPABASE_URL=https://$NEW_SUPABASE_HOST"
    echo ""
}

# ============================================================================
# Main Execution
# ============================================================================

main() {
    print_header
    check_prerequisites "$@"
    test_connection
    decompress_backup
    import_database
    verify_import
    cleanup
    show_summary
}

# Trap errors and cleanup
trap 'print_error "Script failed on line $LINENO"; rm -f "$TEMP_SQL"' ERR

# Run main function
main "$@"
