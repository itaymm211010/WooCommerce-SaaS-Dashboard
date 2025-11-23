# Supabase Edge Functions

> Complete reference for all Edge Functions in the WooCommerce SaaS Dashboard project

---

## 📋 Table of Contents

- [Overview](#overview)
- [Available Edge Functions](#available-edge-functions)
- [Shared Utilities](#shared-utilities)
- [Creating New Edge Functions](#creating-new-edge-functions)
- [Security Guidelines](#security-guidelines)
- [Testing Edge Functions](#testing-edge-functions)
- [AI Agent System](#ai-agent-system)

---

## 🎯 Overview

This project uses **Supabase Edge Functions** (powered by Deno) for serverless backend operations. All functions follow security best practices with authentication, authorization, and audit logging.

**Deployment:** Edge Functions auto-deploy when pushed to GitHub via Lovable Cloud integration.

---

## 📚 Available Edge Functions

### Core API Functions

#### `woo-proxy`
**Purpose:** Secure proxy for WooCommerce REST API calls
**Security:** Prevents credential exposure by handling API calls server-side
**Usage:**
```typescript
const { data, error } = await supabase.functions.invoke('woo-proxy', {
  body: {
    storeId: 'uuid',
    endpoint: '/wp-json/wc/v3/products',
    method: 'GET',
    params: { per_page: 100 }
  }
})
```
**Authentication:** ✅ `withAuth`
**Authorization:** ✅ `verifyStoreAccess`
**Input Validation:** ✅ Zod schema

---

#### `coolify-proxy`
**Purpose:** Proxy for Coolify API to avoid Mixed Content issues (HTTPS → HTTP)
**Security:** Solves browser security restrictions when calling HTTP Coolify API from HTTPS app
**Usage:**
```typescript
const { data, error } = await supabase.functions.invoke('coolify-proxy', {
  body: {
    path: '/api/v1/applications',
    method: 'GET'
  }
})
```
**Note:** Alternative to nginx reverse proxy solution
**Authentication:** ✅ Optional (depends on use case)
**CORS:** ✅ Configured for all origins

---

### WooCommerce Sync Functions

#### `sync-woo-products`
**Purpose:** Pull products from WooCommerce and sync to Supabase
**Features:**
- Syncs products with variations
- Handles product images
- Tracks sync timestamps
- Conflict resolution

**Usage:**
```typescript
const { data, error } = await supabase.functions.invoke('sync-woo-products', {
  body: { storeId: 'uuid' }
})
```
**Authentication:** ✅ `withAuth`
**Authorization:** ✅ `verifyStoreAccess`
**Input Validation:** ✅ Zod schema

---

#### `update-woo-product`
**Purpose:** Push product changes from Supabase to WooCommerce
**Features:**
- Updates product details
- Syncs variations
- Handles images
- Updates sync timestamps

**Usage:**
```typescript
const { data, error } = await supabase.functions.invoke('update-woo-product', {
  body: {
    storeId: 'uuid',
    productId: 'uuid'
  }
})
```
**Authentication:** ✅ `withAuth`
**Authorization:** ✅ `verifyStoreAccess`
**Input Validation:** ✅ Zod schema

---

#### `bulk-sync-to-woo`
**Purpose:** Bulk sync multiple products to WooCommerce
**Features:**
- Batch processing
- Progress tracking
- Error handling per product

**Usage:**
```typescript
const { data, error } = await supabase.functions.invoke('bulk-sync-to-woo', {
  body: {
    storeId: 'uuid',
    productIds: ['uuid1', 'uuid2', 'uuid3']
  }
})
```
**Authentication:** ✅ `withAuth`
**Authorization:** ✅ `verifyStoreAccess`
**Input Validation:** ✅ Zod schema

---

#### `sync-taxonomies`
**Purpose:** Sync categories, tags, and brands from WooCommerce
**Features:**
- Hierarchical category support
- Tag synchronization
- Brand management

**Usage:**
```typescript
const { data, error } = await supabase.functions.invoke('sync-taxonomies', {
  body: { storeId: 'uuid' }
})
```
**Authentication:** ✅ `withAuth`
**Authorization:** ✅ `verifyStoreAccess`
**Input Validation:** ✅ Zod schema

---

#### `sync-global-attributes`
**Purpose:** Sync WooCommerce global attributes (size, color, etc.)
**Features:**
- Attribute synchronization
- Term management

**Usage:**
```typescript
const { data, error } = await supabase.functions.invoke('sync-global-attributes', {
  body: { storeId: 'uuid' }
})
```
**Authentication:** ✅ `withAuth`
**Authorization:** ✅ `verifyStoreAccess`

---

#### `manage-taxonomy`
**Purpose:** Create, update, or delete taxonomies in WooCommerce
**Features:**
- CRUD operations for categories/tags/brands
- Hierarchy management

**Usage:**
```typescript
const { data, error } = await supabase.functions.invoke('manage-taxonomy', {
  body: {
    storeId: 'uuid',
    taxonomy: 'product_cat',
    action: 'create',
    data: { name: 'New Category' }
  }
})
```
**Authentication:** ✅ `withAuth`
**Authorization:** ✅ `verifyStoreAccess`
**Input Validation:** ✅ Zod schema

---

### Webhook Functions

#### `woocommerce-order-status`
**Purpose:** Webhook receiver for WooCommerce order status changes
**Security:** HMAC SHA256 signature verification
**Features:**
- Validates webhook signature
- Logs webhook activity
- Updates order status in Supabase

**Triggered By:** WooCommerce webhook delivery
**Authentication:** ⚠️ Webhook signature verification (not user auth)
**Logging:** ✅ All webhooks logged to `webhook_logs` table

---

#### `generate-webhook-secret`
**Purpose:** Generate cryptographically secure webhook secret
**Usage:**
```typescript
const { data, error } = await supabase.functions.invoke('generate-webhook-secret', {
  body: { storeId: 'uuid' }
})
```
**Authentication:** ✅ `withAuth`
**Authorization:** ✅ `verifyStoreAccess`
**Input Validation:** ✅ Zod schema

---

### AI & Automation Functions

#### `ai-chat`
**Purpose:** AI-powered chat assistance
**Features:**
- Natural language processing
- Context-aware responses

**Authentication:** ✅ `withAuth`

---

#### `sync-health-agent`
**Purpose:** AI agent for monitoring WooCommerce sync health
**Features:**
- Analyzes sync logs
- Detects anomalies
- Generates insights
- Creates alerts

**Scheduling:** Runs via Deno.cron every 6 hours
**See:** [README-AGENTS.md](./README-AGENTS.md) for full documentation

---

#### `agent-coordinator`
**Purpose:** Coordinates multiple AI agents and their execution
**Features:**
- Agent orchestration
- Execution scheduling
- Result aggregation

**Scheduling:** Runs via Deno.cron
**See:** [README-AGENTS.md](./README-AGENTS.md) for full documentation

---

#### `detect-bugs`
**Purpose:** AI-powered bug detection in code and operations
**Features:**
- Code analysis
- Error pattern detection

**Authentication:** ✅ `withAuth`

---

#### `handle-anomaly-response`
**Purpose:** Automated response to detected anomalies
**Features:**
- Alert processing
- Automated remediation suggestions

---

### User Management

#### `reset-user-password`
**Purpose:** Secure password reset functionality
**Features:**
- Token generation
- Email delivery
- Security logging

**Authentication:** ⚠️ Public endpoint (rate-limited)

---

## 🛠️ Shared Utilities

Located in `supabase/functions/_shared/`:

### `auth-middleware.ts`
**Exports:**
- `withAuth(handler)` - Authentication wrapper
- `verifyStoreAccess(userId, storeId)` - Multi-tenant authorization

**Usage:**
```typescript
import { withAuth, verifyStoreAccess } from '../_shared/auth-middleware.ts'

serve(withAuth(async (req, auth) => {
  const { storeId } = await req.json()
  await verifyStoreAccess(auth.userId, storeId)
  // Your logic here
}))
```

---

### `store-utils.ts`
**Exports:**
- `getStoreCredentials(storeId)` - Secure credential retrieval via RPC
- `getStoreDetails(storeId)` - Get store info + credentials

**Usage:**
```typescript
import { getStoreCredentials } from '../_shared/store-utils.ts'

const { api_key, api_secret } = await getStoreCredentials(storeId)
```

**Security:** Uses RPC function `get_store_credentials` with audit logging

---

### `webhook-middleware.ts`
**Exports:**
- `verifyWebhookSignature(payload, signature, secret)` - HMAC verification

**Usage:**
```typescript
import { verifyWebhookSignature } from '../_shared/webhook-middleware.ts'

const isValid = await verifyWebhookSignature(
  req.body,
  req.headers.get('x-wc-webhook-signature'),
  webhookSecret
)
```

---

### `woocommerce-utils.ts`
**Exports:**
- Helper functions for WooCommerce API interactions

---

### `sync-logger.ts`
**Exports:**
- Logging utilities for sync operations

---

### `validation-schemas.ts`
**Exports:**
- Zod schemas for input validation

**Available Schemas:**
- `WooProxySchema` - For woo-proxy requests
- `ManageTaxonomySchema` - For taxonomy operations
- `SyncProductsSchema` - For product sync requests
- `UpdateProductSchema` - For product updates
- `BulkSyncSchema` - For bulk operations

**Usage:**
```typescript
import { WooProxySchema } from '../_shared/validation-schemas.ts'

const validated = WooProxySchema.parse(await req.json())
```

---

## 🆕 Creating New Edge Functions

### Quick Start

```bash
# 1. Create function directory
mkdir -p supabase/functions/your-function-name

# 2. Create index.ts
cat > supabase/functions/your-function-name/index.ts << 'EOF'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { withAuth, verifyStoreAccess } from '../_shared/auth-middleware.ts'
import { getStoreCredentials } from '../_shared/store-utils.ts'

serve(withAuth(async (req, auth) => {
  try {
    const { storeId } = await req.json()

    // Verify access
    await verifyStoreAccess(auth.userId, storeId)

    // Get credentials
    const credentials = await getStoreCredentials(storeId)

    // Your logic here

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[your-function-name] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}))
EOF

# 3. Add to this README.md
# 4. Update DEVELOPMENT.md
# 5. Update CHANGELOG.md

# 6. Commit and push
git add supabase/functions/your-function-name/
git commit -m "feat: Add your-function-name edge function"
git push origin main

# 7. Lovable auto-deploys to Supabase
```

---

## 🔐 Security Guidelines

### Every Edge Function MUST:

1. ✅ **Use `withAuth` middleware** for authentication
2. ✅ **Use `verifyStoreAccess`** for multi-tenant authorization
3. ✅ **Use Zod validation** for input validation
4. ✅ **Use `getStoreCredentials`** for credential access (never direct DB)
5. ✅ **Never expose credentials** in responses or logs
6. ✅ **Log errors** with function name prefix
7. ✅ **Return proper HTTP status codes** (200, 400, 401, 403, 500)
8. ✅ **Handle CORS** if called from browser

### Security Template

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { withAuth, verifyStoreAccess } from '../_shared/auth-middleware.ts'
import { getStoreCredentials } from '../_shared/store-utils.ts'
import { YourSchema } from '../_shared/validation-schemas.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  return withAuth(async (req, auth) => {
    try {
      // 1. Validate input
      const validated = YourSchema.parse(await req.json())

      // 2. Verify authorization
      await verifyStoreAccess(auth.userId, validated.storeId)

      // 3. Get credentials securely
      const { api_key, api_secret } = await getStoreCredentials(validated.storeId)

      // 4. Your business logic

      // 5. Return success
      return new Response(
        JSON.stringify({ success: true, data: result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (error) {
      console.error('[function-name] Error:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: error.status || 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
  })(req)
})
```

---

## 🧪 Testing Edge Functions

### Local Testing (Limited)

Since we use Lovable Cloud, local testing is limited. Use deployed functions:

```bash
# Test via curl
curl -X POST https://ddwlhgpugjyruzejggoz.supabase.co/functions/v1/woo-proxy \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "storeId": "uuid-here",
    "endpoint": "/wp-json/wc/v3/products",
    "method": "GET"
  }'
```

### View Logs

1. Go to Lovable Cloud → Edge Functions
2. Select function name
3. View logs in real-time

### Frontend Testing

```typescript
// In your React component
const testFunction = async () => {
  const { data, error } = await supabase.functions.invoke('woo-proxy', {
    body: {
      storeId: store.id,
      endpoint: '/wp-json/wc/v3/products',
      method: 'GET'
    }
  })

  if (error) {
    console.error('Function error:', error)
  } else {
    console.log('Function result:', data)
  }
}
```

---

## 🤖 AI Agent System

For detailed documentation on the AI Agent system (sync-health-agent, agent-coordinator), see:

**[README-AGENTS.md](./README-AGENTS.md)**

### Quick Summary

- **sync-health-agent** - Monitors WooCommerce sync health (runs every 6 hours)
- **agent-coordinator** - Orchestrates multiple AI agents
- **Database Tables:**
  - `agent_insights` - AI-generated insights
  - `agent_alerts` - Critical alerts
  - `agent_execution_log` - Execution history

---

## 📊 Function Statistics

**Total Edge Functions:** 16

**By Category:**
- Core API: 2 (woo-proxy, coolify-proxy)
- WooCommerce Sync: 6
- Webhooks: 2
- AI & Automation: 4
- User Management: 1
- Utilities: 1

**Security Status:**
- ✅ All functions use authentication
- ✅ All functions use authorization
- ✅ All user-facing functions have input validation
- ✅ All credential access via secure RPC
- ✅ All webhooks use signature verification

---

## 🔗 Related Documentation

- [DEVELOPMENT.md](../../DEVELOPMENT.md) - Development workflow
- [PROJECT_STRUCTURE.md](../../PROJECT_STRUCTURE.md) - Project architecture
- [README-AGENTS.md](./README-AGENTS.md) - AI Agent system details
- [.claude/documentation-rules.md](../../.claude/documentation-rules.md) - Documentation guidelines

---

## 📞 Support

For issues with Edge Functions:
1. Check Lovable Cloud logs
2. Review function code in `supabase/functions/[name]/`
3. Check shared utilities in `supabase/functions/_shared/`
4. Create GitHub issue if needed

---

**📌 Maintenance Info**

**Last Updated:** 2025-11-23
**Last Commit:** `85020d5` - Migration to Supabase Self-Hosted documentation
**Updated By:** Claude Code

**Update History:**
| Date | Commit | Changes | Updated By |
|------|--------|---------|------------|
| 2025-11-23 | `85020d5` | Updated deployment method to Supabase CLI (Self-Hosted) | Claude Code |
| 2025-11-23 | `533a2db` | Initial creation with all 16 Edge Functions | Claude Code |

---

**Total Functions:** 16 | **Security:** ✅ All Secured | **Deployment:** 🔧 Manual via Supabase CLI
