#!/bin/bash

# Quick script to export data from LOVABLE via API

SUPABASE_URL="https://ddwlhgpugjyruzejggoz.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd2xoZ3B1Z2p5cnV6ZWpnZ296Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NTY1OTYsImV4cCI6MjA3NjAzMjU5Nn0.nNlk2uXLnF_Y2ZLNcZ7xUM-mF4rJ_cl1CKslmmYXLms"

echo "Testing LOVABLE API access..."

# Test if we can access the API
curl -s "${SUPABASE_URL}/rest/v1/" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}"

echo ""
echo "If this works, we can export data via API!"
