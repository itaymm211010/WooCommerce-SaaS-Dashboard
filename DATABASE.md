# Database Management Guide

## 🗄️ Database Information

### Supabase Hosted Instance

This project uses **Supabase.com hosted PostgreSQL** database.

**Connection Details:**
- **Project ID**: `ddwlhgpugjyruzejggoz`
- **Project URL**: `https://ddwlhgpugjyruzejggoz.supabase.co`
- **Dashboard**: https://supabase.com/dashboard/project/ddwlhgpugjyruzejggoz

**Access Levels:**
- **Public (Anon Key)**: Read/write via RLS policies
- **Service Role**: Full database access (use in Edge Functions only)
- **Direct Connection**: PostgreSQL connection string (for advanced operations)

---

## 🔐 Accessing the Database

### Via Supabase Dashboard (Recommended)

**SQL Editor:**
```
https://supabase.com/dashboard/project/ddwlhgpugjyruzejggoz/sql
```

Use this for:
- Running migrations
- Querying data
- Creating/modifying tables
- Managing RLS policies
- Debugging issues

**Table Editor:**
```
https://supabase.com/dashboard/project/ddwlhgpugjyruzejggoz/editor
```

Use this for:
- Viewing table data
- Manual data entry
- Quick edits

**Database Settings:**
```
https://supabase.com/dashboard/project/ddwlhgpugjyruzejggoz/settings/database
```

### Via Supabase CLI

```bash
# Link your local project
npx supabase link --project-ref ddwlhgpugjyruzejggoz

# You'll be prompted for:
# - Access token (get from: https://supabase.com/dashboard/account/tokens)
# - Database password (optional)
```

### Direct PostgreSQL Connection

**Connection String:**
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

Get your connection details from:
```
https://supabase.com/dashboard/project/ddwlhgpugjyruzejggoz/settings/database
```

**Using psql:**
```bash
psql "postgresql://postgres.ddwlhgpugjyruzejggoz:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres"
```

---

## 🔄 Running Migrations

### Method 1: Supabase CLI (Recommended)

```bash
# 1. Link to project (one-time setup)
npx supabase link --project-ref ddwlhgpugjyruzejggoz

# 2. Push all pending migrations
npx supabase db push

# 3. Verify migrations
npx supabase migration list
```

### Method 2: Manual via Dashboard

1. **Go to SQL Editor**:
   ```
   https://supabase.com/dashboard/project/ddwlhgpugjyruzejggoz/sql
   ```

2. **Copy migration file content**:
   - Navigate to `supabase/migrations/` in your project
   - Open the migration file you want to run
   - Copy its entire content

3. **Paste and run**:
   - Paste in SQL Editor
   - Click "Run" (or press `Ctrl+Enter`)
   - Check for success/error messages

4. **Verify**:
   ```sql
   -- Check applied migrations
   SELECT * FROM supabase_migrations.schema_migrations
   ORDER BY version DESC;
   ```

### Method 3: Batch Migration Script

If you have multiple migrations to run:

```bash
# Create a temporary file with all migrations
cat supabase/migrations/*.sql > temp_all_migrations.sql

# Then run via Dashboard SQL Editor
# Or use psql:
psql "your-connection-string" < temp_all_migrations.sql
```

---

## 🚀 Initial Database Setup

For a **fresh installation**, run migrations in this order:

### Step 1: Core Schema
```
20251014171204_a710d0c6-2bbf-466b-a308-f72d0c8ef711.sql
```
This creates:
- Core tables (profiles, stores, products, orders)
- User roles system
- RLS policies
- Basic indexes

### Step 2: Admin User Assignment
```
20251127000000_add_first_admin_user.sql
```
OR use the specific script:
```
assign_admin_to_maor.sql
```

### Step 3: Run Remaining Migrations
Run all other migration files in chronological order (by timestamp in filename).

---

## 👤 User Management

### Assigning Admin Role

**For the first user (maor.itay@gmail.com):**

```sql
-- Run in SQL Editor
DO $$
DECLARE
  user_id_var UUID;
BEGIN
  SELECT id INTO user_id_var
  FROM auth.users
  WHERE email = 'maor.itay@gmail.com'
  LIMIT 1;

  IF user_id_var IS NOT NULL THEN
    DELETE FROM user_roles WHERE user_id = user_id_var;
    INSERT INTO user_roles (user_id, role)
    VALUES (user_id_var, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    RAISE NOTICE 'Admin role assigned!';
  ELSE
    RAISE EXCEPTION 'User not found. Please sign up first.';
  END IF;
END $$;
```

**Verify admin assignment:**

```sql
SELECT
  u.id,
  u.email,
  ur.role,
  u.created_at
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
ORDER BY u.created_at ASC;
```

### Creating Additional Admins

```sql
-- Replace with actual email
DO $$
DECLARE
  user_id_var UUID;
  user_email TEXT := 'new-admin@example.com';
BEGIN
  SELECT id INTO user_id_var
  FROM auth.users
  WHERE email = user_email;

  IF user_id_var IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (user_id_var, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;
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

### Check Recent Migrations

```sql
SELECT
  version,
  name,
  executed_at
FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 20;
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
-- Test as specific user (run in SQL Editor)
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
1. Check credentials in `.env`
2. Verify project ID: `ddwlhgpugjyruzejggoz`
3. Check network connectivity
4. Verify Supabase status: https://status.supabase.com

### Issue: Migration fails

**Solution:**
1. Check error message carefully
2. Verify migration SQL syntax
3. Check for conflicting migrations
4. Verify table/column doesn't already exist
5. Check RLS policies aren't blocking

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

### Issue: Can't see data in Table Editor

**Cause**: RLS is enabled and you're viewing as authenticated user

**Solution:**
- Use SQL Editor instead (bypasses RLS when using service role)
- Or temporarily disable RLS for the table

---

## 📚 Additional Resources

- **Supabase Dashboard**: https://supabase.com/dashboard/project/ddwlhgpugjyruzejggoz
- **Supabase Docs**: https://supabase.com/docs
- **RLS Guide**: https://supabase.com/docs/guides/auth/row-level-security
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

---

## 🔗 Quick Links

| Resource | URL |
|----------|-----|
| Dashboard | https://supabase.com/dashboard/project/ddwlhgpugjyruzejggoz |
| SQL Editor | https://supabase.com/dashboard/project/ddwlhgpugjyruzejggoz/sql |
| Table Editor | https://supabase.com/dashboard/project/ddwlhgpugjyruzejggoz/editor |
| Logs | https://supabase.com/dashboard/project/ddwlhgpugjyruzejggoz/logs |
| Settings | https://supabase.com/dashboard/project/ddwlhgpugjyruzejggoz/settings/general |
| API Docs | https://supabase.com/dashboard/project/ddwlhgpugjyruzejggoz/settings/api |

---

**Last Updated**: 2025-11-27
