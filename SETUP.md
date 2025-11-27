# Setup Guide - WooCommerce SaaS Dashboard

## 🎯 Quick Start for First Time Setup

### Step 1: Initial Setup

```bash
# Clone and install
git clone https://github.com/itaymm211010/WooCommerce-SaaS-Dashboard.git
cd WooCommerce-SaaS-Dashboard
npm install
```

### Step 2: Environment Configuration

Your `.env` file is configured with:
```env
VITE_SUPABASE_PROJECT_ID="ddwlhgpugjyruzejggoz"
VITE_SUPABASE_URL="https://api.ssw-ser.com"
VITE_SUPABASE_PUBLISHABLE_KEY="[your-key]"
```

**Note**: This project uses **Self-Hosted Supabase** deployed on Coolify at `https://api.ssw-ser.com`

### Step 3: Database Setup

**IMPORTANT**: This project uses **Self-Hosted Supabase on Coolify** (not Supabase.com).

#### Get PostgreSQL Credentials from Coolify

1. Login to your Coolify dashboard
2. Navigate to your Supabase project
3. Find PostgreSQL credentials (host, port, password)

#### Run Migrations

**Option A: Using psql (Recommended)**

```bash
# Connect to your database
psql "postgresql://postgres:YOUR_PASSWORD@YOUR_DB_HOST:5432/postgres"

# Run migrations
\i supabase/migrations/20251127000000_add_first_admin_user.sql
```

**Option B: Via Supabase Studio**

If Supabase Studio is enabled:
1. Go to: https://api.ssw-ser.com/project/default/sql
2. Copy migration SQL and paste
3. Run

**Option C: Batch all migrations**

```bash
cat supabase/migrations/*.sql > all_migrations.sql
psql "your-connection-string" < all_migrations.sql
```

See [DATABASE.md](./DATABASE.md) for detailed migration instructions.

---

## 🔐 Admin Access Setup

### For User: maor.itay@gmail.com

After you sign up with your email, you need to assign yourself the admin role.

#### Option 1: Run the Automated Migration (Recommended)

The migration `20251127000000_add_first_admin_user.sql` will automatically:
- Check if there are any admin users
- If not, assign admin role to the first registered user
- That's you! 🎉

**Via psql:**
```bash
psql "postgresql://postgres:YOUR_PASSWORD@YOUR_DB_HOST:5432/postgres" < supabase/migrations/20251127000000_add_first_admin_user.sql
```

**Or via Supabase Studio:**
1. Go to: https://api.ssw-ser.com/project/default/sql
2. Copy the contents of `supabase/migrations/20251127000000_add_first_admin_user.sql`
3. Paste and run
4. Refresh the app and log in again

#### Option 2: Manual Admin Assignment (If needed)

If the automatic method doesn't work, run this SQL:

```sql
DO $$
DECLARE
  user_id_var UUID;
BEGIN
  -- Get your user ID
  SELECT id INTO user_id_var
  FROM auth.users
  WHERE email = 'maor.itay@gmail.com'
  LIMIT 1;

  -- Assign admin role
  IF user_id_var IS NOT NULL THEN
    DELETE FROM user_roles WHERE user_id = user_id_var;

    INSERT INTO user_roles (user_id, role)
    VALUES (user_id_var, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    RAISE NOTICE 'Admin role assigned successfully!';
  ELSE
    RAISE EXCEPTION 'User not found. Please sign up first.';
  END IF;
END $$;
```

---

## 🚀 Running the Application

### Development Mode

```bash
npm run dev
```

App will be available at: http://localhost:5173

### Production Build

```bash
npm run build
npm run preview
```

---

## 📦 Deploying Edge Functions

If you need to deploy or update Supabase Edge Functions:

```bash
# Deploy all functions
npx supabase functions deploy

# Or deploy specific functions
npx supabase functions deploy sync-woo-products
npx supabase functions deploy update-woo-product
npx supabase functions deploy ai-chat
npx supabase functions deploy reset-user-password
```

---

## ✅ Verification

After setup, verify everything works:

1. **Sign up**: Go to `/auth/signup` and create your account with `maor.itay@gmail.com`
2. **Assign Admin**: Run the admin assignment SQL (see above)
3. **Log in**: Go to `/auth/signin` and log in
4. **Check Admin Access**: You should see "Admin" in the sidebar menu
5. **Test Features**:
   - Create a store
   - Add products
   - Check admin panel at `/admin/users`

---

## 🔧 Common Issues

### Issue: "Can't access /admin/users"

**Cause**: Admin role not assigned

**Solution**:
1. Log out
2. Run the admin assignment SQL in Supabase Dashboard
3. Log back in

### Issue: "Migration failed"

**Cause**: Migration already exists or conflicts

**Solution**:
```sql
-- Check existing migrations
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version DESC;

-- If needed, manually run the migration content
```

### Issue: "Functions not working"

**Cause**: Edge Functions not deployed

**Solution**:
```bash
npx supabase functions deploy
```

---

## 📝 Next Steps

After successful setup:

1. ✅ Add your first WooCommerce store in `/stores`
2. ✅ Configure store API credentials
3. ✅ Sync products from WooCommerce
4. ✅ Set up webhooks for real-time updates
5. ✅ Invite team members (via Admin panel)

---

## 🆘 Need Help?

- Check the main [README.md](./README.md) for detailed documentation
- Review Supabase logs: https://supabase.com/dashboard/project/ddwlhgpugjyruzejggoz/logs
- Check Edge Functions logs for API issues
- Email: maor.itay@gmail.com
