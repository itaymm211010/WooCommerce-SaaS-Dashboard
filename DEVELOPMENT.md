# Development Guide

> Complete guide for developing the WooCommerce SaaS Dashboard

---

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Working with Edge Functions](#working-with-edge-functions)
- [Database Operations](#database-operations)
- [Testing](#testing)
- [Debugging](#debugging)
- [Security Guidelines](#security-guidelines)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v20+ ([install with nvm](https://github.com/nvm-sh/nvm))
- **npm** or **bun**
- **Git** for version control
- **Code editor** (VS Code recommended)

### Initial Setup

```bash
# 1. Clone the repository
git clone https://github.com/itaymm211010/WooCommerce-SaaS-Dashboard.git
cd WooCommerce-SaaS-Dashboard

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# 4. Start development server
npm run dev
```

### Environment Variables

Required in `.env`:

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Server-side only (never commit)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important**: Never commit `.env` to git. The `.env.example` contains safe placeholders only.

---

## 🔄 Development Workflow

### Branch Strategy

We use **feature branches** for development:

```bash
# Create a new feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description

# Or for documentation
git checkout -b docs/what-you-are-documenting
```

### Commit Message Format

Follow this structure:

```
type: Short description (max 50 chars)

Optional detailed explanation of what changed and why.
Include relevant issue numbers.

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `docs:` - Documentation changes
- `security:` - Security improvements
- `migration:` - Database migrations
- `test:` - Test additions or fixes
- `chore:` - Build/config changes

**Examples:**

```bash
# Good commits
git commit -m "feat: Add bulk product export functionality"
git commit -m "fix: Resolve duplicate image upload issue"
git commit -m "security: Implement RLS for webhook_logs table"

# Avoid
git commit -m "update"  # Too vague
git commit -m "fixed stuff"  # Not descriptive
```

### Development Cycle

```mermaid
graph LR
    A[Create Branch] --> B[Make Changes]
    B --> C[Test Locally]
    C --> D[Commit]
    D --> E{Major Change?}
    E -->|Yes| F[Create PR]
    E -->|No| G[Push to Main]
    F --> H[Code Review]
    H --> I[Merge]
    I --> J[Auto Deploy]
    G --> J
```

**Process:**

1. **Create feature branch** from `main`
2. **Make changes** and test locally
3. **Commit frequently** with descriptive messages
4. **Push to GitHub**
5. **Create Pull Request** for major changes
6. **Wait for review** (or use AI reviewer)
7. **Merge** when approved
8. **Deploy manually** using your hosting platform (Vercel, Netlify, etc.)

### When to Use Pull Requests

**Use PRs for:**
- ✅ Security changes (RLS, credentials, authentication)
- ✅ Database migrations (schema changes)
- ✅ Major features or refactoring
- ✅ Breaking changes
- ✅ When you want code review

**Skip PRs for:**
- ❌ Typo fixes
- ❌ Documentation updates
- ❌ Minor UI tweaks
- ❌ Hotfixes (but document afterward)

### Code Review Process

```bash
# Request AI review with Claude Code
# In your PR description, ask: "Please review this PR for security issues"

# Manual review checklist:
# - [ ] Security: No credentials exposed
# - [ ] RLS: Policies updated for new tables
# - [ ] Tests: All tests pass
# - [ ] Migrations: Applied in correct order
# - [ ] Documentation: Updated if needed
# - [ ] CHANGELOG: Notable changes documented
```

---

## ⚙️ Working with Edge Functions

### Supabase Deployment (Self-Hosted on Coolify)

**Important**: This project uses **Self-Hosted Supabase** deployed on Coolify (not Supabase.com).

**Project Details:**
- **Supabase URL**: `https://api.ssw-ser.com`
- **Project ID**: `ddwlhgpugjyruzejggoz`
- **Hosting**: Coolify (Self-Hosted Open Source Supabase)
- **Studio**: https://api.ssw-ser.com/project/default (if enabled)

**Deployment Process:**
- Edge Functions: Deploy via Coolify or direct Docker access
- Migrations: Run via psql or Supabase Studio
- Logs: Check Coolify logs or PostgreSQL logs
- Database: Direct PostgreSQL access via connection string from Coolify

### Creating a New Edge Function

```bash
# 1. Create function directory
mkdir -p supabase/functions/your-function-name

# 2. Create index.ts
cat > supabase/functions/your-function-name/index.ts << 'EOF'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { withAuth } from '../_shared/auth-middleware.ts'
import { getStoreCredentials } from '../_shared/store-utils.ts'

serve(withAuth(async (req, auth) => {
  try {
    const { storeId } = await req.json()

    // Get store credentials securely
    const credentials = await getStoreCredentials(storeId)

    // Your logic here

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}))
EOF

# 3. Deploy to Supabase
npx supabase functions deploy your-function-name

# 4. Commit and push to GitHub
git add supabase/functions/your-function-name/
git commit -m "feat: Add your-function-name edge function"
git push origin main

# 5. Verify via Coolify or test the function
curl -X POST https://api.ssw-ser.com/functions/v1/your-function-name \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Edge Function Security Checklist

Every Edge Function must:

- ✅ Use `withAuth` middleware for authentication
- ✅ Use `verifyStoreAccess` for authorization
- ✅ Use `getStoreCredentials` for credential access
- ✅ Never expose credentials in responses
- ✅ Log errors and important events
- ✅ Handle errors gracefully
- ✅ Return proper HTTP status codes

**Template:**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { withAuth, verifyStoreAccess } from '../_shared/auth-middleware.ts'
import { getStoreCredentials } from '../_shared/store-utils.ts'

serve(withAuth(async (req, auth) => {
  try {
    const { storeId, ...data } = await req.json()

    // Verify user has access to this store
    await verifyStoreAccess(auth.userId, storeId)

    // Get credentials securely
    const { api_key, api_secret } = await getStoreCredentials(storeId)

    // Your business logic

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[function-name] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: error.status || 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}))
```

### Shared Utilities

Located in `supabase/functions/_shared/`:

- **`auth-middleware.ts`** - `withAuth`, `verifyStoreAccess`
- **`store-utils.ts`** - `getStoreCredentials`, `getStoreDetails`
- **`webhook-middleware.ts`** - Webhook signature verification
- **`woocommerce-utils.ts`** - WooCommerce API helpers
- **`sync-logger.ts`** - Sync operation logging

Always import from `_shared` to maintain consistency.

### Testing Edge Functions Locally

Testing Edge Functions:

```bash
# Option 1: Test via deployed function
curl -X POST https://xxx.supabase.co/functions/v1/your-function \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"storeId":"uuid-here"}'

# Option 2: View logs in Coolify
# Navigate to: Coolify Dashboard → Supabase Project → Logs
# Or check PostgreSQL logs directly
```

---

## 🗄️ Database Operations

### Creating Migrations

```bash
# 1. Create migration file
# Format: YYYYMMDDHHMMSS_description.sql
touch supabase/migrations/$(date +%Y%m%d%H%M%S)_add_new_table.sql

# 2. Write SQL
cat > supabase/migrations/$(date +%Y%m%d%H%M%S)_add_new_table.sql << 'EOF'
-- Add new table
CREATE TABLE IF NOT EXISTS your_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can access their store data"
  ON your_table FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = your_table.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_your_table_store_id ON your_table(store_id);

-- Comments
COMMENT ON TABLE your_table IS 'Description of your table';
EOF

# 3. Commit migration
git add supabase/migrations/
git commit -m "migration: Add your_table for feature X"
git push

# 4. Run migration in Supabase
# Migrations must be run manually via Supabase Dashboard

# Option A: Using psql (Recommended for Self-Hosted)
# Get credentials from Coolify
psql "postgresql://postgres:YOUR_PASSWORD@YOUR_DB_HOST:5432/postgres" < supabase/migrations/YYYYMMDDHHMMSS_migration_name.sql

# Option B: Via Supabase Studio (if enabled)
# 1. Go to: https://api.ssw-ser.com/project/default/sql
# 2. Copy contents of the migration file
# 3. Paste and run in SQL Editor
# 4. Verify success

# Option C: Via Docker Exec (if using Docker)
docker exec -it <postgres-container> psql -U postgres < /path/to/migration.sql
```

### RLS Policy Template

Every table must have RLS enabled:

```sql
-- Enable RLS
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- Multi-tenant access policy
CREATE POLICY "Users can manage their store data"
  ON your_table FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = your_table.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Service role bypass (for Edge Functions)
CREATE POLICY "Service role has full access"
  ON your_table FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

### Updating Database Schema

After schema changes:

```bash
# 1. Generate new TypeScript types
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts

# 2. Commit type updates
git add src/integrations/supabase/types.ts
git commit -m "chore: Update database types"
```

---

## 🧪 Testing

### Frontend Testing

```bash
# Run linter
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

### Manual Testing Checklist

Before deploying major changes:

- [ ] Authentication works (login/logout)
- [ ] Store creation and editing
- [ ] Product CRUD operations
- [ ] WooCommerce sync (pull and push)
- [ ] Webhook delivery and logging
- [ ] Multi-tenancy (users see only their stores)
- [ ] Security (credentials not exposed)
- [ ] Error handling (network failures, API errors)

### Security Testing

```bash
# Check for exposed secrets
git secrets --scan

# Verify RLS policies
# Run via psql or Supabase Studio:
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

# Test unauthorized access (should fail)
# Try accessing another user's store via API
```

---

## 🐛 Debugging

### Frontend Debugging

```bash
# Enable verbose logging
# In browser console:
localStorage.setItem('debug', '*')

# View network requests
# Chrome DevTools → Network → Filter by "supabase" or "woo"

# React Query DevTools
# Available in dev mode at bottom-left corner
```

### Edge Function Debugging

```bash
# View logs in Coolify
# Navigate to: Coolify Dashboard → Your Supabase Project → Logs

# Add console.log statements
console.log('[function-name] Debug info:', variable)
console.error('[function-name] Error:', error)

# Check Edge Function status
curl https://xxx.supabase.co/functions/v1/your-function/health
```

### Common Issues

**Issue: "No rows returned" from `get_store_credentials`**
- **Cause**: User doesn't have access to store
- **Fix**: Verify user_id matches store.user_id

**Issue: "Failed to fetch" from WooCommerce API**
- **Cause**: Invalid credentials or unreachable store URL
- **Fix**: Test credentials manually in Postman/curl

**Issue: Edge Function not deploying**
- **Cause**: Deployment error or Coolify configuration issue
- **Fix**: Check Coolify logs, verify Supabase container is running, check Edge Functions are enabled

**Issue: RLS policy blocking access**
- **Cause**: Missing or incorrect RLS policy
- **Fix**: Review policies, ensure user_id check is correct

---

## 🔐 Security Guidelines

### Critical Rules

1. **NEVER** commit credentials to git
   - Use `.env` for secrets (gitignored)
   - Use environment variables in Edge Functions

2. **NEVER** expose credentials in client code
   - Always use `woo-proxy` for WooCommerce API calls
   - Never pass `api_key` or `api_secret` to frontend

3. **ALWAYS** use RLS policies
   - Every table must have RLS enabled
   - Test policies with different users

4. **ALWAYS** use `withAuth` middleware
   - All Edge Functions must authenticate requests
   - Use `verifyStoreAccess` for multi-tenant checks

5. **ALWAYS** log security events
   - Credential access → `credential_access_logs`
   - Failed auth attempts → logs
   - Suspicious activity → alerts

### Using woo-proxy Pattern

**Frontend code - CORRECT:**

```typescript
const { data, error } = await supabase.functions.invoke('woo-proxy', {
  body: {
    storeId: store.id,
    endpoint: '/wp-json/wc/v3/products',
    method: 'GET'
  }
})
```

**Frontend code - WRONG (NEVER DO THIS):**

```typescript
// ❌ WRONG - Credentials exposed
const response = await fetch(
  `${store.url}/wp-json/wc/v3/products?consumer_key=${api_key}&consumer_secret=${api_secret}`
)
```

### Security Review Checklist

Before merging security-related PRs:

- [ ] No credentials in client-side code
- [ ] All API calls use `woo-proxy` or Edge Functions
- [ ] RLS policies updated for new tables
- [ ] `withAuth` and `verifyStoreAccess` used
- [ ] Error messages don't leak sensitive data
- [ ] Audit logging in place
- [ ] Input validation implemented
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitized output)

---

## 🔧 Common Tasks

### Adding a New WooCommerce Endpoint

```typescript
// In frontend component
const syncOrders = async () => {
  const { data, error } = await supabase.functions.invoke('woo-proxy', {
    body: {
      storeId: store.id,
      endpoint: '/wp-json/wc/v3/orders',  // New endpoint
      method: 'GET',
      params: {  // Optional query params
        per_page: 100,
        status: 'processing'
      }
    }
  })

  if (error) {
    console.error('Failed to fetch orders:', error)
    return
  }

  // Process orders
  console.log('Orders:', data)
}
```

### Adding a New Sync Operation

1. Create Edge Function (e.g., `sync-woo-orders`)
2. Implement sync logic with retry/backoff
3. Log sync events to `sync_logs`
4. Update `synced_at` timestamp
5. Handle conflicts (compare timestamps)

### Adding a New Table

1. Create migration with table + RLS
2. Update TypeScript types
3. Add frontend queries/mutations
4. Implement CRUD Edge Functions if needed
5. Document in PROJECT_STRUCTURE.md

---

## 🆘 Troubleshooting

### Build Fails

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run build
```

### Deployment Issues

```bash
# Rebuild and redeploy
npm run build

# Or push to trigger CI/CD (if configured)
git commit --allow-empty -m "chore: trigger redeploy"
git push
```

### Database Connection Issues

```bash
# Verify Supabase credentials
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Test connection
curl https://xxx.supabase.co/rest/v1/ \
  -H "apikey: YOUR_ANON_KEY"
```

### WooCommerce API Issues

```bash
# Test credentials manually
curl https://yourstore.com/wp-json/wc/v3/products \
  -u "consumer_key:consumer_secret"

# Check WooCommerce REST API status
# Navigate to: WordPress Admin → WooCommerce → Status → REST API
```

---

## 📚 Additional Resources

- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - Architecture overview
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
- [CHANGELOG.md](./CHANGELOG.md) - Version history
- [.claude/project-context.md](./.claude/project-context.md) - AI context
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [WooCommerce REST API](https://woocommerce.github.io/woocommerce-rest-api-docs/)

---

## 🎯 Quick Commands Reference

```bash
# Development
npm run dev           # Start dev server
npm run build         # Build for production
npm run preview       # Preview production build
npm run lint          # Run linter

# Git
git checkout -b feature/name   # Create feature branch
git add .                      # Stage changes
git commit -m "type: message"  # Commit with message
git push origin branch-name    # Push to GitHub

# Testing
curl -X POST https://xxx.supabase.co/functions/v1/function-name \
  -H "Authorization: Bearer ANON_KEY" \
  -d '{"key":"value"}'
```

---

**Happy Coding! 🚀**

*Last Updated: 2025-11-08*
