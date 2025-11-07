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
**Problem**: Initially, API keys and secrets were stored in plain database columns, accessible to anyone with database access. Additionally, credentials were exposed in:
- Plain text in UI (StoreDetails.tsx)
- URL query parameters (consumer_key/consumer_secret in WooCommerce API calls)
- Client-side code making direct API calls to WooCommerce

**Solution**: Implemented multi-layer security:
1. **RPC Functions** - `get_store_credentials(store_uuid)` with authorization
2. **Row Level Security** - Postgres RLS policies on stores table
3. **Audit Logging** - All credential access logged to `credential_access_logs`
4. **Service Role Only** - Edge Functions use service role key to bypass RLS
5. **Webhook Verification** - HMAC SHA256 signatures for webhooks
6. **woo-proxy Edge Function** - Server-side proxy for ALL WooCommerce API calls
7. **UI Credential Masking** - Credentials hidden with show/hide toggles in UI

### woo-proxy Architecture (CRITICAL)
**Edge Function**: `supabase/functions/woo-proxy/index.ts`

**Purpose**: Centralized, secure proxy for all WooCommerce REST API calls
- Prevents credential exposure in URLs
- Keeps API keys/secrets server-side only
- Enforces user authentication and store access control
- Logs all WooCommerce API interactions

**Usage Pattern**:
```typescript
// Frontend code - NEVER include credentials
const { data, error } = await supabase.functions.invoke('woo-proxy', {
  body: {
    storeId: store.id,           // Store UUID
    endpoint: '/wp-json/wc/v3/products',  // WooCommerce endpoint
    method: 'GET',               // HTTP method
    body: { name: 'Product' }    // Optional request body (for POST/PUT)
  }
});
```

**Security Flow**:
1. Frontend calls woo-proxy with store ID (NO credentials)
2. woo-proxy verifies user authentication via `withAuth`
3. woo-proxy verifies user access to store via `verifyStoreAccess`
4. woo-proxy fetches credentials securely via `getStoreCredentials`
5. woo-proxy makes authenticated request to WooCommerce
6. woo-proxy returns response to frontend

### Important Security Notes
- **NEVER** access `api_key`, `api_secret`, `webhook_secret` directly from stores table
- **NEVER** pass credentials in URL query parameters or client-side code
- **ALWAYS** use `woo-proxy` edge function for WooCommerce API calls from frontend
- **ALWAYS** use `get_store_credentials` RPC function in Edge Functions
- **ALWAYS** use `getStoreCredentials` utility when credentials needed in Edge Functions
- **ALWAYS** hide credentials in UI with masked display (show/hide toggles)
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

### Fixed Issues ✅
1. ~~**Sync Logging Action Mismatch**~~ - FIXED (2025-11-06)
   - Actions in `sync-woo-products` and `update-woo-product` didn't match database CHECK constraint
   - Fixed by changing action values: 'sync_from_woo' → 'sync', 'create_in_woo' → 'create', 'update_to_woo' → 'update'

2. ~~**Credentials Exposed in UI**~~ - FIXED (2025-11-06)
   - StoreDetails.tsx showed api_key and api_secret in plain text
   - Fixed with masked display and show/hide toggles

3. ~~**Credentials in URL Parameters**~~ - PARTIALLY FIXED (2025-11-06)
   - WooCommerce API calls passed consumer_key/consumer_secret in URLs
   - Created `woo-proxy` edge function for secure server-side proxy
   - Updated 7 critical order-related files to use proxy
   - **Remaining**: 4 less-critical files still need updates (see Security-Critical Files section)

4. ~~**manage-taxonomy PUBLIC Edge Function**~~ - FIXED (2025-11-06)
   - CRITICAL: Function had no authentication, anyone could manipulate taxonomies
   - Added `withAuth` and `verifyStoreAccess` middleware

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
- **`src/utils/storeCredentials.ts`** - DEPRECATED: Use woo-proxy instead for WooCommerce API calls
- **`src/pages/stores/components/`** - All store-related UI components
- **`src/pages/stores/components/StoreDetails.tsx`** - Shows masked credentials with show/hide toggles
- **`src/integrations/supabase/types.ts`** - Auto-generated from database schema

### Backend (Edge Functions)
- **`supabase/functions/woo-proxy/index.ts`** - **CRITICAL**: Use for ALL WooCommerce API calls from frontend
- **`supabase/functions/_shared/store-utils.ts`** - `getStoreCredentials` for secure credential access
- **`supabase/functions/_shared/auth-middleware.ts`** - `withAuth` and `verifyStoreAccess` wrappers
- **`supabase/functions/_shared/sync-logger.ts`** - Sync operation logging utilities
- **`supabase/migrations/`** - Database schema changes

### Security-Critical Files (Updated to use woo-proxy)
- ✅ `src/components/dashboard/RecentOrderNotes.tsx`
- ✅ `src/pages/stores/[id]/orders/index.tsx`
- ✅ `src/pages/stores/[id]/orders/[orderId]/details.tsx`
- ✅ `src/pages/stores/[id]/orders/hooks/useOrderNotes.ts`
- ✅ `src/pages/stores/[id]/orders/hooks/useCreateOrderNote.ts`
- ✅ `src/pages/stores/[id]/orders/hooks/useUpdateOrderStatus.ts`
- ✅ `src/pages/stores/[id]/orders/services/orderService.ts`
- ⏳ `src/pages/stores/components/AddStoreForm.tsx` - TODO: Update to use woo-proxy
- ⏳ `src/pages/stores/utils/currencyUtils.ts` - TODO: Update to use woo-proxy
- ⏳ `src/pages/stores/utils/webhookUtils.ts` - TODO: Update to use woo-proxy
- ⏳ `src/pages/products/components/ProductAttributesTab.tsx` - TODO: Update to use woo-proxy

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

## 📝 Recent Security Improvements (2025-11-06)

### woo-proxy Implementation
- Created centralized secure proxy for all WooCommerce API calls
- Prevents credential exposure in client-side code and URL parameters
- Enforces authentication and multi-tenant access control
- Updated 7 critical order management files to use proxy pattern

### Files Updated (Chronological Order)
1. `supabase/functions/manage-taxonomy/index.ts` - Added authentication (CRITICAL FIX)
2. `src/pages/stores/components/StoreDetails.tsx` - Masked credentials in UI
3. `supabase/functions/woo-proxy/index.ts` - Created secure proxy function
4. `src/components/dashboard/RecentOrderNotes.tsx` - Updated to use proxy
5. `src/pages/stores/[id]/orders/index.tsx` - Updated to use proxy
6. `src/pages/stores/[id]/orders/hooks/useOrderNotes.ts` - Updated to use proxy
7. `src/pages/stores/[id]/orders/hooks/useCreateOrderNote.ts` - Updated to use proxy
8. `src/pages/stores/[id]/orders/hooks/useUpdateOrderStatus.ts` - Updated to use proxy
9. `src/pages/stores/[id]/orders/services/orderService.ts` - Updated to use proxy
10. `src/pages/stores/[id]/orders/[orderId]/details.tsx` - Updated to use proxy

### Next Steps
Complete woo-proxy migration for remaining 4 files:
- `AddStoreForm.tsx` (store creation validation)
- `currencyUtils.ts` (currency updates)
- `webhookUtils.ts` (webhook management)
- `ProductAttributesTab.tsx` (attribute sync)

---

**Last Updated**: 2025-11-07
**Maintained By**: Itay (@itaymm211010)
