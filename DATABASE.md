# Database Management Guide

## 🗄️ Database Information

### Self-Hosted Supabase (Coolify)

This project uses **Self-Hosted Supabase** deployed on Coolify.

**Connection Details:**
- **Supabase URL**: `https://api.ssw-ser.com`
- **Project ID**: `ddwlhgpugjyruzejggoz`
- **Deployment**: Coolify (Self-Hosted Open Source Supabase)

**Access Levels:**
- **Public (Anon Key)**: Read/write via RLS policies
- **Service Role**: Full database access (use in Edge Functions only)
- **Direct PostgreSQL Connection**: Via connection string (see below)

---

## 🔐 Accessing the Database

### Via Supabase Studio (Web Interface)

If you have Supabase Studio enabled in your Coolify deployment:

```
https://api.ssw-ser.com/project/default
```

Or access through Coolify's dashboard.

### Via Direct PostgreSQL Connection

**Connection String Format:**
```
postgresql://postgres:[password]@[postgres-host]:[port]/postgres
```

You need to get the PostgreSQL credentials from:
1. **Coolify Dashboard** → Your Supabase project → Database settings
2. Or from your Supabase `.env` file in Coolify

**Using psql:**
```bash
# Replace with your actual credentials
psql "postgresql://postgres:YOUR_PASSWORD@YOUR_DB_HOST:5432/postgres"
```

### Via pgAdmin or Other GUI Tools

**Connection Parameters:**
- **Host**: Your PostgreSQL host (from Coolify)
- **Port**: Usually `5432`
- **Database**: `postgres`
- **Username**: `postgres`
- **Password**: From Coolify/Supabase config

### Via Supabase CLI (Local)

```bash
# If you have local Supabase running
supabase db connect

# Or connect directly
psql "postgresql://postgres:YOUR_PASSWORD@YOUR_DB_HOST:5432/postgres"
```

---

## 🔄 Running Migrations

### Method 1: SQL Script via PostgreSQL Client

**Recommended for Self-Hosted:**

```bash
# Connect to your database
psql "postgresql://postgres:YOUR_PASSWORD@YOUR_DB_HOST:5432/postgres"

# Run migration
\i /path/to/migration.sql

# Or from the shell
psql "your-connection-string" < supabase/migrations/YOUR_MIGRATION.sql
```

### Method 2: Via Supabase Studio

If Supabase Studio is available:

1. Navigate to: `https://api.ssw-ser.com/project/default/sql`
2. Copy the migration SQL
3. Paste and execute
4. Verify success

### Method 3: Batch Migrations

Run all migrations at once:

```bash
# Create combined migration file
cat supabase/migrations/*.sql > all_migrations.sql

# Run it
psql "your-connection-string" < all_migrations.sql

# Or manually via psql
psql "your-connection-string"
\i all_migrations.sql
```

### Method 4: Using Docker Exec (if Supabase runs in Docker)

```bash
# Find your Supabase database container
docker ps | grep postgres

# Exec into it
docker exec -it <postgres-container-name> psql -U postgres

# Then run migrations
\i /path/to/migration.sql
```

---

## 🚀 Initial Database Setup

For a **fresh installation**, run migrations in this order:

### Step 1: Core Schema
```bash
psql "your-connection-string" < supabase/migrations/20251014171204_a710d0c6-2bbf-466b-a308-f72d0c8ef711.sql
```

This creates:
- Core tables (profiles, stores, products, orders)
- User roles system
- RLS policies
- Basic indexes

### Step 2: Admin User Assignment
```bash
psql "your-connection-string" < supabase/migrations/20251127000000_add_first_admin_user.sql
```

OR use the specific script:
```bash
psql "your-connection-string" < assign_admin_to_maor.sql
```

### Step 3: Run Remaining Migrations

Run all other migration files in chronological order (by timestamp in filename).

---

## 👤 User Management

### Assigning Admin Role to maor.itay@gmail.com

**Connect to your database:**
```bash
psql "postgresql://postgres:YOUR_PASSWORD@YOUR_DB_HOST:5432/postgres"
```

**Run this SQL:**
```sql
DO $$
DECLARE
  user_id_var UUID;
BEGIN
  -- Get user ID by email
  SELECT id INTO user_id_var
  FROM auth.users
  WHERE email = 'maor.itay@gmail.com'
  LIMIT 1;

  -- Assign admin role
  IF user_id_var IS NOT NULL THEN
    -- Delete existing roles to avoid conflicts
    DELETE FROM user_roles WHERE user_id = user_id_var;

    -- Insert admin role
    INSERT INTO user_roles (user_id, role)
    VALUES (user_id_var, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    RAISE NOTICE 'Admin role assigned to maor.itay@gmail.com!';
  ELSE
    RAISE EXCEPTION 'User not found. Please sign up first at the app.';
  END IF;
END $$;
```

**Verify:**
```sql
SELECT
  u.id,
  u.email,
  ur.role,
  u.created_at
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE u.email = 'maor.itay@gmail.com';
```

---

## 📊 Useful Queries

### Check All Users and Roles

```sql
SELECT
  u.id,
  u.email,
  u.created_at,
  COALESCE(
    string_agg(ur.role::text, ', '),
    'no role'
  ) as roles
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
GROUP BY u.id, u.email, u.created_at
ORDER BY u.created_at DESC;
```

### Check Store Access

```sql
SELECT
  s.id,
  s.name,
  s.url,
  u.email as owner_email,
  COUNT(DISTINCT su.user_id) as additional_users
FROM stores s
JOIN auth.users u ON u.id = s.user_id
LEFT JOIN store_users su ON su.store_id = s.id
GROUP BY s.id, s.name, s.url, u.email
ORDER BY s.created_at DESC;
```

### Check RLS Policies

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Check Migrations Status

```sql
-- Check if migrations table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'supabase_migrations'
  AND table_name = 'schema_migrations'
);

-- If exists, list applied migrations
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version DESC;
```

### Database Size and Statistics

```sql
-- Table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Row counts
SELECT
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;
```

---

## 🔒 Security Best Practices

### RLS Policy Checklist

Every table should have:
- ✅ RLS enabled: `ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;`
- ✅ Policies for SELECT, INSERT, UPDATE, DELETE
- ✅ Multi-tenant isolation (check store ownership)
- ✅ Service role bypass for Edge Functions

### Testing RLS Policies

```sql
-- Test as specific user
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = 'user-uuid-here';

-- Try selecting data
SELECT * FROM products;

-- Reset
RESET ROLE;
```

### Credential Management

**NEVER:**
- ❌ Expose service role key in client code
- ❌ Store credentials in git
- ❌ Return sensitive data in API responses

**ALWAYS:**
- ✅ Use anon key in frontend
- ✅ Use service role only in Edge Functions
- ✅ Store API keys in `stores` table (server-side only)
- ✅ Use `woo-proxy` Edge Function for WooCommerce calls

---

## 🐛 Troubleshooting

### Issue: Can't connect to database

**Solution:**
1. Check Coolify dashboard - is Supabase running?
2. Verify connection string from Coolify
3. Check network connectivity (firewall, VPN)
4. Test with: `pg_isready -h YOUR_HOST -p 5432`

### Issue: Migration fails

**Solution:**
1. Check error message carefully
2. Verify PostgreSQL user has sufficient privileges
3. Check for conflicting migrations
4. Verify table/column doesn't already exist
5. Run migrations one by one to identify the problematic one

### Issue: RLS blocking legitimate access

**Solution:**
```sql
-- Temporarily disable RLS for debugging (BE CAREFUL!)
ALTER TABLE your_table DISABLE ROW LEVEL SECURITY;

-- Test your queries
SELECT * FROM your_table;

-- Re-enable RLS
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- Fix your policies
```

### Issue: Can't access Supabase Studio

**Solution:**
1. Check if Studio is enabled in Coolify
2. Verify the URL: `https://api.ssw-ser.com/project/default`
3. Check authentication credentials
4. Use direct PostgreSQL connection as alternative

---

## 🔧 Accessing Coolify-Managed Supabase

### Getting Database Credentials from Coolify

1. **Login to Coolify Dashboard**
2. **Navigate to your Supabase project**
3. **Go to Environment Variables** or **Database Settings**
4. **Look for:**
   - `POSTGRES_PASSWORD`
   - `POSTGRES_HOST`
   - `POSTGRES_PORT`
   - `POSTGRES_DB`

### Supabase Studio Access

If enabled in Coolify:
```
https://api.ssw-ser.com/project/default
```

Credentials should be in your Coolify Supabase configuration.

---

## 📚 Additional Resources

- **Your Supabase Instance**: https://api.ssw-ser.com
- **Coolify Documentation**: https://coolify.io/docs
- **Supabase Self-Hosted Docs**: https://supabase.com/docs/guides/self-hosting
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

---

## 🔗 Quick Reference

| Resource | Details |
|----------|---------|
| Supabase URL | https://api.ssw-ser.com |
| Project ID | ddwlhgpugjyruzejggoz |
| Deployment | Coolify (Self-Hosted) |
| Database | PostgreSQL (via Coolify) |
| Admin Email | maor.itay@gmail.com |

---

## 🚀 Quick Start Checklist

- [ ] Get PostgreSQL credentials from Coolify
- [ ] Test connection with `psql`
- [ ] Run core schema migration
- [ ] Sign up at the app with maor.itay@gmail.com
- [ ] Assign admin role via SQL
- [ ] Run remaining migrations
- [ ] Test admin access at `/admin/users`

---

**Last Updated**: 2025-11-27
