# Project Context & Background

## Important Information for AI Assistants

This file contains critical context about the project that should be remembered across sessions.

---

## 🏗️ Infrastructure Setup

### **CRITICAL: Database & Backend**
- **Database**: This project uses **LOVABLE CLOUD SUPABASE**, NOT regular Supabase
- **What this means**:
  - Database is managed by Lovable, not a separate Supabase account
  - Edge Functions are auto-deployed via Lovable → Supabase integration
  - No direct Supabase CLI access - everything goes through Lovable
  - Migrations may need to be run via Lovable's interface or SQL Editor
  - Cannot use `npx supabase functions deploy` directly without access token

### Deployment Flow
```
GitHub (Source)
    ↓
Lovable (Build & Deploy)
    ↓
Supabase (Lovable-managed)
```

### Access Credentials
- **Frontend**: Deployed automatically by Lovable
- **Backend**: Supabase managed by Lovable
- **GitHub**: Connected via Lovable integration
- **No separate Supabase dashboard login** - access via Lovable Cloud interface

---

## 🎯 Project Goals

### Primary Objectives
1. **Multi-tenant SaaS** - Manage multiple WooCommerce stores from one dashboard
2. **Real-time Sync** - Bidirectional sync between dashboard and WooCommerce
3. **Product Management** - Full CRUD with variations, attributes, images
4. **Webhook System** - Real-time updates from WooCommerce stores
5. **Security First** - RLS, credential encryption, audit logging

### Target Users
- E-commerce managers with multiple WooCommerce stores
- Agencies managing client stores
- Store owners wanting centralized control

---

## 🔐 Security Architecture

### Credential Protection Strategy
**Problem**: Initially, API keys and secrets were stored in plain database columns, accessible to anyone with database access.

**Solution**: Implemented multi-layer security:
1. **RPC Functions** - `get_store_credentials(store_uuid)` with authorization
2. **Row Level Security** - Postgres RLS policies on stores table
3. **Audit Logging** - All credential access logged to `credential_access_logs`
4. **Service Role Only** - Edge Functions use service role key to bypass RLS
5. **Webhook Verification** - HMAC SHA256 signatures for webhooks

### Important Security Notes
- **NEVER** access `api_key`, `api_secret`, `webhook_secret` directly from stores table
- **ALWAYS** use `get_store_credentials` RPC function in Edge Functions
- **ALWAYS** use `getStoreCredentials` utility in Frontend (via RPC)
- **LOG** all credential access for audit trail

---

## 📊 Data Sync Strategy

### Sync Tracking Fields
Every syncable entity has:
- **`source`** (enum: 'woo' | 'local') - Origin of data
- **`synced_at`** (timestamp) - Last successful sync time

### Sync Logic
```typescript
if (woo_id && synced_at) {
  // UPDATE existing item in WooCommerce
} else if (woo_id && !synced_at) {
  // SYNC needed - item changed locally
} else {
  // CREATE new item in WooCommerce
}
```

### Preventing Duplicate Syncs
- Check `synced_at` before uploading images/products
- Update `synced_at` after successful sync
- Use `source` to determine data origin

---

## 🐛 Known Issues & Quirks

### Current Bugs
1. **Duplicate Image Uploads**: Images re-upload on every save
   - **Root Cause**: Code doesn't check `synced_at` before upload
   - **Fix**: Check if `woo_media_id` and `synced_at` exist before uploading

2. **`generate-webhook-secret` Not Deployed**: Function exists but not live
   - **Workaround**: Generate secret via SQL:
     ```sql
     UPDATE stores SET webhook_secret = encode(gen_random_bytes(32), 'base64') WHERE id = 'store_id';
     ```

3. **Migrations Not Applied**: Some migrations pending in Lovable Cloud
   - **Required**:
     - `20251105000001_add_sync_tracking_fields.sql`
     - `20251105000003_secure_sensitive_fields.sql`

### Architecture Quirks
- **WooCommerce Variation API**: Must create parent product first, then variations
- **Image Upload**: WooCommerce requires base64 or URL, we use direct media upload
- **Webhook Secrets**: Must be configured in WooCommerce webhook settings manually
- **Currency Detection**: Fetched from WooCommerce settings on first sync

---

## 🔄 Common Workflows

### Adding a New Edge Function
1. Create function in `supabase/functions/function-name/`
2. Add auth middleware: `withAuth(async (req, auth) => {...})`
3. Use `getStoreDetails` for credentials
4. Commit and push to GitHub
5. Lovable auto-deploys to Supabase
6. Verify in Lovable Cloud → Edge Functions

### Adding a New Migration
1. Create SQL file in `supabase/migrations/`
2. Name format: `YYYYMMDDHHMMSS_description.sql`
3. Test locally if possible
4. Commit and push
5. Run via Lovable Cloud → Database → SQL Editor

### Debugging Edge Function Issues
1. Check logs: Lovable Cloud → Edge Functions → Function Name → Logs
2. Verify credentials: Ensure RPC function `get_store_credentials` exists
3. Check auth: Verify `withAuth` middleware is used
4. Test locally: Can't really test Edge Functions locally without Supabase CLI

### Git & Deployment Workflow

#### Direct to Main (Quick Changes)
For small fixes, documentation updates, or hotfixes:
```bash
git add .
git commit -m "Description of change"
git push origin main
# → Lovable auto-deploys immediately
```

#### Feature Branch + PR (Recommended for Major Changes)
For large features, security changes, migrations, or when you want code review:
```bash
# 1. Create feature branch
git checkout -b feature/description

# 2. Make changes and commit
git add .
git commit -m "Add new feature"

# 3. Push branch
git push origin feature/description

# 4. Create PR (manually or via gh CLI)
gh pr create --title "Add new feature" --body "Description"

# 5. Review and test
# Ask Claude: "Review PR #123"

# 6. Merge when ready
gh pr merge
# → Only then Lovable deploys to production
```

#### When to Use PRs
- ✅ Security changes (RLS, credentials, authentication)
- ✅ Database migrations (schema changes)
- ✅ Major features or refactoring
- ✅ When you want AI code review before deploy
- ❌ Skip for: typo fixes, documentation, minor UI tweaks

#### Commit Message Format
```
Type: Short description (50 chars max)

Optional longer explanation of what changed and why.

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

Common types: `feat:`, `fix:`, `refactor:`, `docs:`, `security:`, `migration:`

---

## 📚 Key Files to Remember

### Frontend
- **`src/utils/storeCredentials.ts`** - ALWAYS use this for credentials in frontend
- **`src/pages/stores/components/`** - All store-related UI components
- **`src/integrations/supabase/types.ts`** - Auto-generated from database schema

### Backend
- **`supabase/functions/_shared/store-utils.ts`** - ALWAYS use for credentials in Edge Functions
- **`supabase/functions/_shared/auth-middleware.ts`** - Authentication wrapper
- **`supabase/migrations/`** - Database schema changes

### Documentation
- **`.claude/project-context.md`** - This file (practical guidelines & context)
- **`.claude/architecture-context.md`** - Sync architecture & design principles
- **`PROJECT_STRUCTURE.md`** - Complete architecture documentation
- **`CHANGELOG.md`** - Version history and changes

---

## 💡 Tips for AI Assistants

### Do's ✅
- Always check if Lovable Cloud is the deployment platform
- Use secure RPC functions for credentials
- Test changes locally before committing
- Update CHANGELOG.md for significant changes
- Use `synced_at` to prevent duplicate operations
- Create migrations for database changes

### Don'ts ❌
- Don't access sensitive fields directly from database
- Don't assume standard Supabase CLI works (it's Lovable-managed)
- Don't deploy without testing security implications
- Don't forget to update `synced_at` after sync operations
- Don't create duplicate Edge Functions
- Don't skip migration files

### When in Doubt
1. Check PROJECT_STRUCTURE.md for architecture
2. Check this file for context
3. Check CHANGELOG.md for recent changes
4. Ask the user for clarification

---

## 🔗 Quick Reference

### Environment
- **Platform**: Lovable Cloud (lovable.dev)
- **Database**: Lovable-managed Supabase (PostgreSQL)
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase Edge Functions (Deno)
- **Deployment**: Auto from GitHub via Lovable

### Important URLs
- **Lovable Project**: https://lovable.dev/projects/bf95ed21-9695-47bb-bea2-c1f45246d48b
- **GitHub**: https://github.com/itaymm211010/WooCommerce-SaaS-Dashboard
- **WooCommerce API Docs**: https://woocommerce.github.io/woocommerce-rest-api-docs/

---

**Last Updated**: 2025-11-06
**Maintained By**: Itay (@itaymm211010)
