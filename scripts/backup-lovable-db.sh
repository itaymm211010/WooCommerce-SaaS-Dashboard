#!/bin/bash

# ============================================================================
# WooCommerce SaaS Dashboard - Database Backup Script
# ============================================================================
# Purpose: Export database from LOVABLE Cloud to local file
# Usage:   ./backup-lovable-db.sh
# Output:  backups/lovable-backup-YYYY-MM-DD-HHMMSS.sql
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y-%m-%d-%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/lovable-backup-${TIMESTAMP}.sql"
BACKUP_COMPRESSED="${BACKUP_FILE}.gz"

# LOVABLE Supabase Connection Details
# Note: You'll need to get these from LOVABLE Cloud dashboard
LOVABLE_DB_HOST="db.ddwlhgpugjyruzejggoz.supabase.co"
LOVABLE_DB_PORT="5432"
LOVABLE_DB_NAME="postgres"
LOVABLE_DB_USER="postgres"
LOVABLE_DB_PASSWORD=""  # ⚠️ SET THIS! Get from LOVABLE → Settings → Database

# ============================================================================
# Functions
# ============================================================================

print_header() {
    echo -e "${GREEN}"
    echo "============================================================================"
    echo "  WooCommerce SaaS - Database Backup"
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

    # Check if pg_dump is installed
    if ! command -v pg_dump &> /dev/null; then
        print_error "pg_dump not found!"
        echo "Install PostgreSQL client:"
        echo "  Ubuntu/Debian: sudo apt-get install postgresql-client"
        echo "  macOS:         brew install postgresql"
        exit 1
    fi
    print_success "pg_dump found"

    # Check if gzip is installed
    if ! command -v gzip &> /dev/null; then
        print_error "gzip not found!"
        exit 1
    fi
    print_success "gzip found"

    # Check if password is set
    if [ -z "$LOVABLE_DB_PASSWORD" ]; then
        print_error "Database password not set!"
        echo ""
        echo "Please edit this script and set LOVABLE_DB_PASSWORD"
        echo "Get it from: LOVABLE Cloud → Settings → Database → Connection String"
        exit 1
    fi
    print_success "Password configured"
}

create_backup_dir() {
    print_step "Creating backup directory..."
    mkdir -p "$BACKUP_DIR"
    print_success "Directory ready: $BACKUP_DIR"
}

export_database() {
    print_step "Exporting database from LOVABLE..."
    echo "Host: $LOVABLE_DB_HOST"
    echo "Database: $LOVABLE_DB_NAME"
    echo ""

    # Set password for pg_dump
    export PGPASSWORD="$LOVABLE_DB_PASSWORD"

    # Run pg_dump with all necessary flags
    pg_dump \
        --host="$LOVABLE_DB_HOST" \
        --port="$LOVABLE_DB_PORT" \
        --username="$LOVABLE_DB_USER" \
        --dbname="$LOVABLE_DB_NAME" \
        --no-owner \
        --no-acl \
        --clean \
        --if-exists \
        --verbose \
        --file="$BACKUP_FILE" \
        2>&1 | grep -v "NOTICE"  # Suppress notices

    # Clear password from environment
    unset PGPASSWORD

    if [ -f "$BACKUP_FILE" ]; then
        print_success "Database exported successfully"
    else
        print_error "Export failed!"
        exit 1
    fi
}

compress_backup() {
    print_step "Compressing backup..."

    gzip "$BACKUP_FILE"

    if [ -f "$BACKUP_COMPRESSED" ]; then
        print_success "Backup compressed"
    else
        print_error "Compression failed!"
        exit 1
    fi
}

show_summary() {
    local file_size=$(du -h "$BACKUP_COMPRESSED" | cut -f1)

    echo ""
    echo -e "${GREEN}"
    echo "============================================================================"
    echo "  Backup Completed Successfully!"
    echo "============================================================================"
    echo -e "${NC}"
    echo "File:     $BACKUP_COMPRESSED"
    echo "Size:     $file_size"
    echo "Date:     $(date)"
    echo ""
    echo "Next Steps:"
    echo "  1. Test the backup: ./scripts/test-backup.sh $BACKUP_COMPRESSED"
    echo "  2. Import to new Supabase: ./scripts/import-to-new-supabase.sh $BACKUP_COMPRESSED"
    echo ""
}

# ============================================================================
# Main Execution
# ============================================================================

main() {
    print_header
    check_prerequisites
    create_backup_dir
    export_database
    compress_backup
    show_summary
}

# Trap errors
trap 'print_error "Script failed on line $LINENO"' ERR

# Run main function
main
