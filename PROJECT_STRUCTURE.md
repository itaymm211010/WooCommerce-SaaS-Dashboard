# WooCommerce SaaS Dashboard - Project Structure

## 📁 Project Overview

A multi-tenant SaaS platform for managing WooCommerce stores, built with React, TypeScript, Supabase, and deployed on Lovable.

---

## 🗂️ Directory Structure

```
WooCommerce-SaaS-Dashboard/
├── src/                          # Frontend source code
│   ├── components/               # Reusable UI components
│   │   ├── ui/                   # Shadcn/UI components
│   │   └── dashboard/            # Dashboard-specific components
│   │
│   ├── pages/                    # Route pages
│   │   ├── stores/               # Store management
│   │   │   ├── [id]/             # Dynamic store routes
│   │   │   │   ├── products/     # Product management
│   │   │   │   ├── orders/       # Order management
│   │   │   │   ├── taxonomies/   # Categories, tags, brands
│   │   │   │   ├── users/        # Store users
│   │   │   │   └── webhooks/     # Webhook management
│   │   │   │       └── index.tsx # Webhook dashboard page
│   │   │   ├── components/       # Store-specific components
│   │   │   │   ├── StoreDetails.tsx
│   │   │   │   ├── WebhooksManager.tsx
│   │   │   │   ├── WebhookLogsViewer.tsx
│   │   │   │   └── WebhookSecretManager.tsx
│   │   │   └── utils/            # Store utilities
│   │   │       ├── webhookUtils.ts
│   │   │       └── currencyUtils.ts
│   │   ├── auth/                 # Authentication pages
│   │   └── project-management/   # Project management features
│   │
│   ├── integrations/             # Third-party integrations
│   │   └── supabase/             # Supabase client & types
│   │       ├── client.ts
│   │       └── types.ts
│   │
│   ├── utils/                    # Utility functions
│   │   └── storeCredentials.ts   # Secure credential access
│   │
│   ├── types/                    # TypeScript type definitions
│   │   └── webhook.ts
│   │
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Core libraries
│   ├── contexts/                 # React contexts
│   └── App.tsx                   # Root application component
│
├── supabase/                     # Backend (Supabase)
│   ├── functions/                # Edge Functions (Deno)
│   │   ├── _shared/              # Shared utilities for functions
│   │   │   ├── auth-middleware.ts      # Authentication & authorization
│   │   │   ├── store-utils.ts          # Secure store credential access
│   │   │   ├── webhook-middleware.ts   # Webhook verification
│   │   │   └── woocommerce-utils.ts    # WooCommerce helpers
│   │   │
│   │   ├── update-woo-product/   # Update product to WooCommerce
│   │   │   ├── index.ts          # Main handler with auth
│   │   │   ├── handlers.ts       # Request processing
│   │   │   ├── product.ts        # Product update logic
│   │   │   ├── store.ts          # Store utilities (re-export)
│   │   │   └── utils.ts          # Helper functions
│   │   │
│   │   ├── sync-woo-products/    # Sync products from WooCommerce
│   │   │   ├── index.ts
│   │   │   ├── products.ts
│   │   │   ├── store.ts
│   │   │   └── utils.ts
│   │   │
│   │   ├── sync-taxonomies/      # Sync categories, tags, brands
│   │   │   ├── index.ts
│   │   │   ├── store.ts
│   │   │   └── utils.ts
│   │   │
│   │   ├── sync-global-attributes/  # Sync WooCommerce attributes
│   │   │   └── index.ts
│   │   │
│   │   ├── manage-taxonomy/      # Create/update/delete taxonomies
│   │   │   └── index.ts
│   │   │
│   │   ├── bulk-sync-to-woo/     # Bulk product sync
│   │   │   └── index.ts
│   │   │
│   │   ├── generate-webhook-secret/  # Generate secure webhook secret
│   │   │   └── index.ts
│   │   │
│   │   ├── woocommerce-order-status/ # Webhook receiver
│   │   │   └── index.ts
│   │   │
│   │   ├── detect-bugs/          # Bug detection utility
│   │   │   └── index.ts
│   │   │
│   │   └── ai-chat/              # AI chat functionality
│   │       └── index.ts
│   │
│   └── migrations/               # Database migrations
│       ├── 20251105000000_add_product_images_unique_constraint.sql
│       ├── 20251105000001_add_sync_tracking_fields.sql
│       ├── 20251105000002_add_webhook_secret.sql
│       ├── 20251105000003_secure_sensitive_fields.sql
│       └── 20251105000004_fix_webhook_logs_rls.sql
│
├── public/                       # Static assets
├── .claude/                      # Claude AI configuration
└── context/                      # Context files for AI

```

---

## 🔑 Key Components

### Frontend Architecture

#### **Pages Structure**
- **`/stores`** - Store list and management
- **`/stores/[id]/products`** - Product catalog management
- **`/stores/[id]/orders`** - Order processing
- **`/stores/[id]/taxonomies`** - Categories, tags, brands
- **`/stores/[id]/webhooks`** - Webhook configuration & logs
- **`/stores/[id]/users`** - Store user management

#### **Core Features**
1. **Product Management**
   - Create, edit, delete products
   - Manage variations and attributes
   - Image upload and management
   - Sync with WooCommerce

2. **Taxonomy Management**
   - Categories (hierarchical)
   - Tags
   - Brands
   - Custom attributes

3. **Webhook System**
   - Real-time sync from WooCommerce
   - Secure signature verification
   - Activity logging and monitoring
   - Secret management

4. **Security**
   - Secure credential storage (RPC functions)
   - Row Level Security (RLS)
   - Audit logging
   - Webhook signature verification

---

## 🗄️ Database Schema

### Core Tables

#### **stores**
```sql
- id (uuid, PK)
- name (text)
- url (text)
- api_key (text, encrypted)        # Secured via RPC
- api_secret (text, encrypted)     # Secured via RPC
- webhook_secret (text, encrypted) # Secured via RPC
- currency (text)
- user_id (uuid, FK -> auth.users)
- created_at, updated_at
```

#### **products**
```sql
- id (uuid, PK)
- store_id (uuid, FK -> stores)
- woo_id (integer)                 # WooCommerce product ID
- name, sku, price, stock_quantity
- type (simple, variable, etc.)
- source (enum: 'woo', 'local')    # Origin tracking
- synced_at (timestamp)            # Sync timestamp
- created_at, updated_at
```

#### **product_variations**
```sql
- id (uuid, PK)
- product_id (uuid, FK -> products)
- woo_id (integer)
- attributes (jsonb)
- price, stock_quantity
- source, synced_at
```

#### **product_images**
```sql
- id (uuid, PK)
- product_id (uuid, FK -> products)
- woo_media_id (integer)           # WooCommerce media ID
- url, display_order
- source, synced_at
```

#### **webhook_logs**
```sql
- id (uuid, PK)
- store_id (uuid, FK -> stores)
- topic (text)                     # e.g., 'order.created'
- status (enum: 'success', 'failed')
- error_message (text)
- received_at (timestamp)
```

#### **credential_access_logs**
```sql
- id (uuid, PK)
- store_id (uuid, FK -> stores)
- user_id (uuid, FK -> auth.users)
- accessed_at (timestamp)
- ip_address, user_agent
```

### Security Functions

#### **get_store_credentials(store_uuid)**
```sql
-- Secure RPC function to retrieve store credentials
-- Enforces authorization and logs access
RETURNS TABLE (api_key, api_secret, webhook_secret)
```

---

## 🔄 Data Flow

### Product Update Flow
```
Frontend → update-woo-product Edge Function
                ↓
        Verify authentication
                ↓
        Get store credentials (RPC)
                ↓
        Fetch product from Supabase
                ↓
        Update WooCommerce via API
                ↓
        Update synced_at timestamp
                ↓
        Return success
```

### Webhook Flow
```
WooCommerce → woocommerce-order-status Edge Function
                ↓
        Verify HMAC signature
                ↓
        Get webhook secret (RPC)
                ↓
        Process webhook payload
                ↓
        Update Supabase database
                ↓
        Log webhook activity
```

---

## 🔐 Security Architecture

### Credential Protection
1. **RLS Policies** - Row Level Security on `stores` table
2. **RPC Functions** - Secure access via `get_store_credentials`
3. **Service Role** - Edge Functions use service role key
4. **Audit Logging** - All credential access logged
5. **Webhook Verification** - HMAC SHA256 signature validation

### Authentication Flow
1. User authenticates via Supabase Auth
2. JWT token stored in client
3. Edge Functions validate token via `withAuth` middleware
4. Store access verified via `verifyStoreAccess`

---

## 🚀 Deployment

### Lovable Platform
- **Frontend**: Auto-deployed from GitHub
- **Edge Functions**: Auto-deployed via Lovable → Supabase
- **Database**: Hosted on Supabase (managed by Lovable)

### Environment Variables
```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx (server-only)
```

---

## 📝 Development Workflow

### Local Development
```bash
npm run dev              # Start Vite dev server
npm run build            # Build for production
npm run type-check       # TypeScript validation
```

### Database Migrations
```bash
# Migrations are auto-applied by Lovable
# Files in supabase/migrations/ run in order
```

### Edge Function Deployment
```bash
# Auto-deployed via Lovable on Git push
# Or manually via Supabase CLI:
npx supabase functions deploy <function-name>
```

---

## 🐛 Known Issues & TODOs

### Current Issues
- [ ] Migration `20251105000003_secure_sensitive_fields.sql` needs to run
- [ ] Function `generate-webhook-secret` not deployed yet
- [ ] Duplicate image uploads need to use `synced_at` field

### Upcoming Features
- [ ] Bulk product operations
- [ ] Advanced reporting
- [ ] Multi-language support
- [ ] Enhanced webhook filtering

---

## 📚 Key Dependencies

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TanStack Query** - Server state management
- **Shadcn/UI** - UI components
- **Tailwind CSS** - Styling

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL - Database
  - Edge Functions - Serverless functions (Deno)
  - Auth - Authentication
  - Storage - File storage
- **WooCommerce REST API** - E-commerce integration

---

## 🔗 Useful Links

- **Lovable Project**: https://lovable.dev/projects/bf95ed21-9695-47bb-bea2-c1f45246d48b
- **GitHub Repository**: https://github.com/itaymm211010/WooCommerce-SaaS-Dashboard
- **WooCommerce API Docs**: https://woocommerce.github.io/woocommerce-rest-api-docs/

---

## 📞 Support

For questions or issues:
1. Check existing GitHub issues
2. Review Claude Code documentation
3. Contact project maintainers

---

**Last Updated**: 2025-01-06
**Version**: 1.0.0
