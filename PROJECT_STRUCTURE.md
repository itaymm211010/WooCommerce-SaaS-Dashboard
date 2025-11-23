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
│   ├── services/                 # API services
│   │   └── CoolifyService.ts     # Coolify API integration
│   │
│   ├── pages/                    # Route pages
│   │   ├── CoolifyTest.tsx       # Coolify integration test page
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
│   │   ├── ai-chat/              # AI chat functionality
│   │   │   └── index.ts
│   │   │
│   │   ├── coolify-proxy/        # Coolify API proxy (alternative)
│   │   │   └── index.ts
│   │   │
│   │   ├── README.md             # Edge Functions documentation
│   │   └── README-AGENTS.md      # AI Agent system documentation
│   │
│   └── migrations/               # Database migrations
│       ├── 20251105000000_add_product_images_unique_constraint.sql
│       ├── 20251105000001_add_sync_tracking_fields.sql
│       ├── 20251105000002_add_webhook_secret.sql
│       ├── 20251105000003_secure_sensitive_fields.sql
│       └── 20251105000004_fix_webhook_logs_rls.sql
│
├── public/                       # Static assets
│
├── .claude/                      # Claude AI configuration
│   ├── project-context.md        # Project context for AI
│   └── documentation-rules.md    # Documentation update guidelines
│
├── Dockerfile                    # Multi-stage build for Coolify
├── nginx.conf                    # nginx config (SPA + reverse proxy)
│
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

This project is fully self-hosted on Coolify:

### 1. Supabase Self-Hosted (Backend)
- **Type**: Self-Hosted Supabase on Coolify
- **URL**: https://api.ssw-ser.com
- **Database**: PostgreSQL 15.8.1.048
- **Edge Functions**: Deno Runtime v1.67.4
- **Storage**: MinIO S3-compatible
- **Hosting**: Coolify Platform (http://91.99.207.249:8000)

**Components:**
- 13 Docker containers (PostgreSQL, Edge Functions, Auth, Storage, etc.)
- Managed via Coolify dashboard
- Direct Docker access for logs and debugging

**Deployment:**
```bash
# Edge Functions deployment
npx supabase link --project-ref default --api-url https://api.ssw-ser.com
npx supabase functions deploy

# Database migrations
npx supabase db push
```

**Environment Variables:**
```env
VITE_SUPABASE_URL=https://api.ssw-ser.com
VITE_SUPABASE_PUBLISHABLE_KEY=xxx  # From Supabase Studio → Settings → API
VITE_SUPABASE_PROJECT_ID=default
```

---

### 2. Coolify Platform (Frontend Deployment)

**Purpose:** Self-hosted deployment management and monitoring

**Architecture:**
```
GitHub → Coolify → Docker Build → nginx Container → React App
                                          ↓
                                   Reverse Proxy
                                          ↓
                                   Coolify API (HTTP)
```

**Deployment Files:**

#### Dockerfile (Multi-stage Build)
```dockerfile
# Stage 1: Build React app
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf
- **SPA Routing:** `try_files $uri $uri/ /index.html;`
- **Reverse Proxy:** `/api/coolify-proxy/*` → `http://coolify:8000/*`
- **Static Caching:** 1 year cache for `/assets/`
- **Gzip Compression:** Enabled for text/json/js files

**Why Reverse Proxy?**
- Application runs on HTTPS (`https://app.ssw-ser.com`)
- Coolify API is HTTP (`http://91.99.207.249:8000`)
- Browser blocks Mixed Content (HTTPS → HTTP requests)
- nginx proxies: `HTTPS app` → `HTTP Coolify` securely

**Configuration:**
- **Build Pack:** Dockerfile (not nixpacks)
- **Environment Variables:** Injected at build time
- **Health Check:** Optional (/ returns 200)

**See:** [DEVELOPMENT.md - Coolify Deployment](./DEVELOPMENT.md#coolify-deployment) for detailed setup

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

**📌 Maintenance Info**

**Last Updated:** 2025-11-23
**Last Commit:** `85020d5` - Migration to Supabase Self-Hosted documentation
**Updated By:** Claude Code

**Update History:**
| Date | Commit | Changes | Updated By |
|------|--------|---------|------------|
| 2025-11-23 | `85020d5` | Updated deployment section for Supabase Self-Hosted on Coolify | Claude Code |
| 2025-11-23 | `533a2db` | Added Coolify deployment, infrastructure files, Edge Functions documentation | Claude Code |
| 2025-01-06 | N/A | Initial PROJECT_STRUCTURE.md creation | Developer |

**Version**: 2.0.0 (Self-Hosted)
