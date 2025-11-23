#!/bin/bash
# Script to run all Supabase migrations on Self-Hosted instance
# Usage: ./run-migrations.sh

set -e

echo "🚀 Running Supabase migrations on Self-Hosted instance..."
echo "Database: supabase-db-csg4gww8cwggks8k84osgcsg"
echo ""

MIGRATIONS_DIR="supabase/migrations"
CONTAINER_NAME="supabase-db-csg4gww8cwggks8k84osgcsg"

# Count migrations
TOTAL=$(ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null | wc -l)
echo "Found $TOTAL migration files"
echo ""

# Run each migration in order
CURRENT=0
for migration in "$MIGRATIONS_DIR"/*.sql; do
    CURRENT=$((CURRENT + 1))
    FILENAME=$(basename "$migration")

    echo "[$CURRENT/$TOTAL] Running: $FILENAME"

    # Copy migration to container and run it
    docker cp "$migration" "$CONTAINER_NAME:/tmp/migration.sql"
    docker exec -i "$CONTAINER_NAME" psql -U postgres -d postgres -f /tmp/migration.sql

    if [ $? -eq 0 ]; then
        echo "✅ Success"
    else
        echo "❌ Failed! Stopping."
        exit 1
    fi

    echo ""
done

echo "🎉 All migrations completed successfully!"
echo ""
echo "Next steps:"
echo "1. Create a user account at https://app.ssw-ser.com"
echo "2. Start using the application!"
