# Project Context & Background

## Important Information for AI Assistants

This file contains critical context about the project that should be remembered across sessions.

---

## 🏗️ Infrastructure Setup

### **Development Workflow (Updated 2026-02-19)**
- **Code**: Written directly with Claude Code (claude-code CLI) — Lovable is NO LONGER used for code generation
- **Local directory**: `C:\Users\Itay\WooCommerce-SaaS-Dashboard\WooCommerce-fresh\`
- **Git flow**: Edit locally → `git push origin main` → Lovable auto-deploys to Supabase
- **Future plan (Phase B)**: Migrate to own Supabase project for full independence from Lovable

### **CRITICAL: Database & Backend**
- **Database**: Still uses **LOVABLE CLOUD SUPABASE** (Phase A — will migrate later)
- **What this means**:
  - Database is managed by Lovable, not a separate Supabase account
  - Edge Functions are auto-deployed when pushing to GitHub (via Lovable → Supabase integration)
  - Migrations run via Lovable Cloud → Database → SQL Editor
  - Cannot use `npx supabase functions deploy` directly without access token

### Deployment Flow
```
Claude Code (local editing)
    ↓
GitHub push (git push origin main)
    ↓
Lovable (auto-deploy trigger)
    ↓
Supabase (Lovable-managed) + Frontend
```

### Access Credentials
- **Frontend**: Deployed automatically by Lovable from GitHub
- **Backend**: Supabase managed by Lovable
- **GitHub**: https://github.com/itaymm211010/WooCommerce-SaaS-Dashboard
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

3. ~~**Credentials in URL Parameters**~~ - FIXED (2025-11-07)
   - WooCommerce API calls passed consumer_key/consumer_secret in URLs
   - Created `woo-proxy` edge function for secure server-side proxy
   - Updated all 11 files to use proxy pattern
   - **100% migration completed** - zero credentials in URLs

4. ~~**manage-taxonomy PUBLIC Edge Function**~~ - FIXED (2025-11-06)
   - CRITICAL: Function had no authentication, anyone could manipulate taxonomies
   - Added `withAuth` and `verifyStoreAccess` middleware

### Current Bugs
- None known as of 2026-02-22

### Fixed Bugs (2026-02-20 to 2026-02-22)
1. ✅ **Duplicate Image Uploads** — `woo_media_id` column added, `transformProductForWooCommerce` sends `{id}` not `{src}` for existing images
2. ✅ **`generate-webhook-secret` Not Deployed** — added to `supabase/config.toml`
3. ✅ **Webhook UI** — rebuilt with 14 topics, Hebrew labels, per-item loading, delete confirmation
4. ✅ **Orders billing null crash** — `order.billing?.first_name ?? ''` with Guest fallback
5. ✅ **Orders Select uncontrolled** — changed `defaultValue` → `value` so UI updates after refetch
6. ✅ **Orders allowedStatusTransitions** — expanded `cancelled` to allow `pending`, `processing`, `on-hold`
7. ✅ **View History empty** — added loading spinner, always refetch logs after status change

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
3. Commit and push to GitHub
4. **Lovable auto-runs migrations** (usually within minutes after push)
5. **If migration doesn't auto-run:**
   - Check Lovable dashboard for pending migration approvals
   - Destructive changes may require manual approval
   - Contact project owner with Lovable Cloud access
6. **Verify:** Check database schema in Lovable Cloud after deployment

### Debugging Edge Function Issues
1. Check logs: Lovable Cloud → Edge Functions → Function Name → Logs
2. Verify credentials: Ensure RPC function `get_store_credentials` exists
3. Check auth: Verify `withAuth` middleware is used
4. Test locally: Can't really test Edge Functions locally without Supabase CLI

### Git & Deployment Workflow

#### Direct to Main (Quick Changes)
For small fixes, documentation updates, or hotfixes:
```bash
git add src/specific-file.tsx
git commit -m "fix: Description of change"
git push origin main
# → Lovable auto-deploys immediately
```

#### Feature Branch + PR (Recommended for Major Changes)
For large features, security changes, migrations, or breaking changes:
```bash
# 1. Create feature branch
git checkout -b feature/description

# 2. Make changes and commit
git add src/...
git commit -m "feat: Add new feature"

# 3. Push branch and create PR
git push origin feature/description
gh pr create --title "Add new feature" --body "Description"

# 4. After review — merge to main
gh pr merge
# → Lovable deploys to production
```

#### When to Use PRs
- ✅ Security changes (RLS, credentials, authentication)
- ✅ Database migrations (schema changes)
- ✅ Major features or refactoring
- ✅ When you want review before deploy
- ❌ Skip for: typo fixes, documentation, minor UI tweaks

#### Commit Message Format
```
type: Short description (50 chars max)

Optional explanation.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

Common types: `feat:`, `fix:`, `refactor:`, `docs:`, `security:`, `migration:`

#### Before Every Push (IMPORTANT)
```bash
git pull --rebase origin main   # sync first to avoid conflicts
npm run build                   # verify no TypeScript errors
git push origin main
```

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
**All files completed - 100% migration** ✅

**Order Management (7 files):**
- ✅ `src/components/dashboard/RecentOrderNotes.tsx`
- ✅ `src/pages/stores/[id]/orders/index.tsx`
- ✅ `src/pages/stores/[id]/orders/[orderId]/details.tsx`
- ✅ `src/pages/stores/[id]/orders/hooks/useOrderNotes.ts`
- ✅ `src/pages/stores/[id]/orders/hooks/useCreateOrderNote.ts`
- ✅ `src/pages/stores/[id]/orders/hooks/useUpdateOrderStatus.ts`
- ✅ `src/pages/stores/[id]/orders/services/orderService.ts`

**Utils & Forms (4 files):**
- ✅ `src/pages/stores/components/AddStoreForm.tsx`
- ✅ `src/pages/stores/utils/currencyUtils.ts`
- ✅ `src/pages/stores/utils/webhookUtils.ts`
- ✅ `src/pages/stores/[id]/products/components/ProductEditor/ProductAttributesTab.tsx`

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

## 📝 Recent Security Improvements

### Phase 1: woo-proxy Implementation (2025-11-06 to 2025-11-07) - COMPLETED ✅
- Created centralized secure proxy for all WooCommerce API calls
- Prevents credential exposure in client-side code and URL parameters
- Enforces authentication and multi-tenant access control
- **100% migration completed** - all 11 frontend files now use secure proxy

**Security Impact:**
- **Zero credentials in client-side code** ✅
- **Zero credentials in URLs** ✅
- **100% WooCommerce API calls secured** ✅
- **All calls authenticated and authorized** ✅

### Phase 2: Input Validation & Customer Data Protection (2025-11-08) - COMPLETED ✅

#### 1. Zod Input Validation - Prevents Injection Attacks
**Created:** `supabase/functions/_shared/validation-schemas.ts`
- Comprehensive Zod schemas for all Edge Function inputs
- Validates data types, formats, and ranges
- Prevents SQL injection, XSS, and malformed data attacks
- Validates UUIDs, endpoints, HTTP methods, product data, etc.

**Edge Functions Updated with Zod Validation:**
1. `supabase/functions/woo-proxy/index.ts` - Validates proxy requests
2. `supabase/functions/manage-taxonomy/index.ts` - Validates taxonomy operations
3. `supabase/functions/sync-woo-products/index.ts` - Validates sync requests
4. `supabase/functions/update-woo-product/index.ts` - Validates product updates
5. `supabase/functions/sync-taxonomies/index.ts` - Validates taxonomy sync
6. `supabase/functions/bulk-sync-to-woo/index.ts` - Validates bulk operations
7. `supabase/functions/generate-webhook-secret/index.ts` - Validates secret generation

**Benefits:**
- ✅ Prevents malformed requests from reaching database
- ✅ Validates all input parameters before processing
- ✅ Clear error messages for invalid data
- ✅ Type-safe request handling
- ✅ Protection against injection attacks

#### 2. Customer Data Privacy - RLS Enhancement
**Created:** `supabase/migrations/20251108235515_fix_customer_data_exposure.sql`

**Problem Fixed:**
- Viewers could see sensitive customer data (email, name) in orders table
- Security risk: Personal information exposed to unauthorized users

**Solution Implemented:**
- **Managers & Owners:** Full access to all order data including customer details
- **Viewers:** Restricted - cannot access orders table directly
- **New View:** `orders_summary` provides masked data for viewers:
  - Customer email: Shows only domain (e.g., `***@example.com`)
  - Customer name: Shows only first letter (e.g., `J***`)
- **Order Status Logs:** Also restricted to managers and owners only

**RLS Policies Updated:**
- `orders` table: SELECT/ALL restricted to managers and owners
- `order_status_logs` table: SELECT/INSERT restricted to managers and owners
- `orders_summary` view: Available to all store users with masked data

**Security Impact:**
- ✅ Customer PII protected from unauthorized access
- ✅ Role-based access control enforced at database level
- ✅ Viewers can still see order statistics without PII exposure
- ✅ Compliant with privacy best practices (GDPR-ready)

### Overall Security Status (as of 2025-11-08)

**Lovable Security Audit - All Issues Resolved:**
1. ✅ Public Taxonomy Management Endpoint - **FIXED** (withAuth + verifyStoreAccess)
2. ✅ Missing Input Validation - **FIXED** (Zod validation on all Edge Functions)
3. ✅ Customer PII Exposure - **FIXED** (RLS policies + masked view)
4. ✅ Credentials in Client Code - **FIXED** (woo-proxy migration)

**Security Layers Active:**
1. **Authentication:** `withAuth` middleware on all Edge Functions
2. **Authorization:** `verifyStoreAccess` for multi-tenant isolation
3. **Input Validation:** Zod schemas prevent injection attacks
4. **Data Privacy:** RLS policies restrict PII access by role
5. **Credential Protection:** woo-proxy + getStoreCredentials pattern
6. **Audit Logging:** credential_access_logs + sync_logs

---

**Last Updated**: 2025-11-08
**Maintained By**: Itay (@itaymm211010)
