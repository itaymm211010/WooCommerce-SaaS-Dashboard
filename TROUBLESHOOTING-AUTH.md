# Troubleshooting Self-Hosted Supabase Authentication

## Problem Summary
**Error**: `POST https://api.ssw-ser.com/auth/v1/token 500 (Internal Server Error)`
**Message**: "Database error querying schema"
**Status**: Auth endpoint returns 500, indicating GoTrue cannot connect to or query the database

---

## Quick Diagnostics

### Step 1: Run Database Diagnostics
```bash
# Copy diagnostic script to container
docker cp diagnose-auth.sql supabase-db-csg4gww8cwggks8k84osgcsg:/tmp/diagnose-auth.sql

# Run diagnostics
docker exec -i supabase-db-csg4gww8cwggks8k84osgcsg psql -U postgres -d postgres -f /tmp/diagnose-auth.sql
```

### Step 2: Check GoTrue Logs
```bash
# Check GoTrue (auth) container logs
docker logs supabase-auth-csg4gww8cwggks8k84osgcsg --tail 100

# Follow logs in real-time
docker logs -f supabase-auth-csg4gww8cwggks8k84osgcsg
```

### Step 3: Check Kong Gateway Logs
```bash
# Kong routes auth requests to GoTrue
docker logs supabase-kong-csg4gww8cwggks8k84osgcsg --tail 100
```

---

## Common Issues & Fixes

### Issue 1: Missing Auth Schema
**Symptom**: "Database error querying schema"
**Cause**: Auth schema not initialized or incomplete

**Fix**: Initialize auth schema manually
```sql
-- Check if auth schema exists
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'auth';

-- If missing, you need to restore from Supabase backup or initialize manually
-- Contact Coolify support or check Supabase documentation
```

### Issue 2: Incorrect GoTrue Environment Variables
**Symptom**: 500 errors on `/auth/v1/token`
**Cause**: GoTrue can't connect to database

**Required Environment Variables for GoTrue**:
```env
# Database Connection
GOTRUE_DB_DRIVER=postgres
DATABASE_URL=postgresql://postgres:[PASSWORD]@supabase-db-csg4gww8cwggks8k84osgcsg:5432/postgres?sslmode=disable

# JWT Configuration
GOTRUE_JWT_SECRET=${SERVICE_PASSWORD_JWT}
GOTRUE_JWT_EXP=3600
GOTRUE_JWT_AUD=authenticated

# API Configuration
API_EXTERNAL_URL=https://api.ssw-ser.com
GOTRUE_SITE_URL=https://app.ssw-ser.com
GOTRUE_URI_ALLOW_LIST=https://app.ssw-ser.com,https://api.ssw-ser.com

# Disable email verification for testing (OPTIONAL)
GOTRUE_MAILER_AUTOCONFIRM=true
GOTRUE_SMTP_ADMIN_EMAIL=admin@ssw-ser.com
```

**Check Current GoTrue Config**:
```bash
docker exec supabase-auth-csg4gww8cwggks8k84osgcsg env | grep GOTRUE
docker exec supabase-auth-csg4gww8cwggks8k84osgcsg env | grep DATABASE_URL
```

### Issue 3: Database Connection String
**Symptom**: GoTrue can't reach database
**Cause**: Wrong host, port, or credentials

**Fix**: Verify database connection from GoTrue container
```bash
# Test database connection from GoTrue container
docker exec supabase-auth-csg4gww8cwggks8k84osgcsg psql -h supabase-db-csg4gww8cwggks8k84osgcsg -U postgres -d postgres -c "SELECT 1"
```

### Issue 4: Missing PostgreSQL Extensions
**Symptom**: "Database error querying schema"
**Cause**: Required extensions not installed

**Fix**: Install required extensions
```sql
-- Run these commands in PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pgjwt";
```

### Issue 5: RLS Policy Violations
**Symptom**: `401 Unauthorized` on `/rest/v1/task_logs`
**Cause**: User not authenticated, RLS policies block access

**Fix**: This is expected behavior when auth fails. Once auth is fixed, this will resolve.

---

## Edge Function Environment Variables

Edge Functions need these environment variables configured in Coolify:

```env
# For Supabase Edge Runtime (Deno)
SUPABASE_URL=https://api.ssw-ser.com
SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MjkwMzI2MCwiZXhwIjo0OTE4NTc2ODYwLCJyb2xlIjoiYW5vbiJ9.FafUy0tS9v3uNzMIf_TVIEMZpAFVrmcl8SPEqppWEnM
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MjkwMzI2MCwiZXhwIjo0OTE4NTc2ODYwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.6VZzIzE_OEWx84Zei15AYdk0mx195eRjR2Z0lfptjqo
```

---

## Verification Steps

### 1. Verify Users Exist
```sql
SELECT id, email, created_at, confirmed_at FROM auth.users LIMIT 5;
```

### 2. Test Authentication via cURL
```bash
# Test user login
curl -X POST https://api.ssw-ser.com/auth/v1/token?grant_type=password \
  -H "Content-Type: application/json" \
  -H "apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MjkwMzI2MCwiZXhwIjo0OTE4NTc2ODYwLCJyb2xlIjoiYW5vbiJ9.FafUy0tS9v3uNzMIf_TVIEMZpAFVrmcl8SPEqppWEnM" \
  -d '{
    "email": "maor.itay@gmail.com",
    "password": "your-password"
  }'
```

### 3. Test with Browser DevTools
```javascript
// Run in browser console at https://app.ssw-ser.com
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'maor.itay@gmail.com',
  password: 'your-password'
})
console.log('Auth result:', { data, error })
```

---

## Next Steps

1. **Run diagnostics**: Use `diagnose-auth.sql` to check database state
2. **Check GoTrue logs**: Identify specific error from GoTrue service
3. **Verify environment variables**: Ensure GoTrue has correct DATABASE_URL and JWT_SECRET
4. **Test database connection**: Verify GoTrue can reach PostgreSQL
5. **Check Kong routing**: Ensure Kong properly routes `/auth/v1/*` to GoTrue

---

## Critical Files

- **Migrations**: `supabase/migrations/` (48 files, already run)
- **Edge Functions**: `supabase/functions/` (16 functions, deployed)
- **Config**: `supabase/config.toml` (function JWT verification settings)
- **Environment**: `.env` (client-side) + `.env.local` (server-side)

---

## Status Checklist

- ✅ Database schema created (48 migrations run)
- ✅ 3 users exist in `auth.users`
- ✅ 16 Edge Functions deployed
- ✅ Environment variables configured (GOTRUE_JWT_SECRET, API_EXTERNAL_URL)
- ✅ Application connects to `https://api.ssw-ser.com`
- ❌ GoTrue authentication failing (500 error)
- ❌ "Database error querying schema" error

---

## Support Resources

- **Supabase Self-Hosted Docs**: https://supabase.com/docs/guides/self-hosting
- **GoTrue Configuration**: https://github.com/supabase/gotrue
- **Coolify Support**: https://coolify.io/docs
