# 🚀 WooPilot

**Put Your WooCommerce on Autopilot**

> A powerful Multi-Tenant SaaS platform for managing multiple WooCommerce stores from a single, centralized dashboard with AI-powered automation.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Self--Hosted-green)](https://supabase.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## ✨ Features

### 🏪 Multi-Store Management
- Manage unlimited WooCommerce stores from one dashboard
- Multi-tenant architecture with complete data isolation
- Role-based access control (Owner, Manager, Viewer)

### 🔄 Bidirectional Sync
- **From WooCommerce:** Pull products, categories, tags, attributes, orders
- **To WooCommerce:** Push products, variations, images, inventory updates
- Real-time webhook integration for instant updates
- Conflict-free sync with source tracking

### 🤖 AI-Powered Automation
- Smart anomaly detection
- Sync health monitoring
- Bug detection and alerting
- AI chat assistant for store management

### 📦 Product Management
- Bulk product editing
- Image gallery management
- Variations & attributes
- Inventory tracking
- SKU management

### 📊 Project Management (Built-in)
- Sprint planning
- Task management
- Work logs & time tracking
- Bug tracking
- Deployment management

### 🔐 Enterprise Security
- Row Level Security (RLS) on all tables
- Multi-tenant data isolation
- PII masking for viewer roles
- Comprehensive audit logging
- Encrypted credentials storage
- Webhook signature verification

---

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 18.3 + TypeScript 5.5
- Vite 5.4 (SWC - Fast Refresh)
- TanStack Query 5.56 (Data Fetching)
- Shadcn/UI (Radix UI + Tailwind CSS)
- React Router 6.26
- Zod 3.23 (Validation)
- i18next 25.6 (Internationalization ready)

**Backend:**
- Supabase (Self-Hosted on Coolify)
- PostgreSQL 15+ (32 tables, 100+ RLS policies)
- Deno Edge Functions (17 serverless functions)
- GoTrue (Authentication)
- PostgREST (Auto-generated REST API)

**Infrastructure:**
- Hetzner Server (4 vCPU, 8GB RAM)
- Coolify (Docker orchestration)
- Let's Encrypt (Auto SSL)
- Grafana (Monitoring)

### System Diagram

```
┌─────────────────────────────────────────────┐
│  WooCommerce Stores (External)              │
│  - Store 1, Store 2, Store 3...             │
└────────────┬────────────────────────────────┘
             │ REST API + Webhooks
             ▼
┌─────────────────────────────────────────────┐
│  WooPilot (app.ssw-ser.com)                 │
│  ┌────────────────────────────────────────┐ │
│  │  React Frontend                        │ │
│  │  - Multi-Store Dashboard               │ │
│  │  - Product Management                  │ │
│  │  - Sync Control                        │ │
│  └────────────┬───────────────────────────┘ │
│               │                              │
│               ▼                              │
│  ┌────────────────────────────────────────┐ │
│  │  Supabase API (api.ssw-ser.com)       │ │
│  │  ┌──────────────────────────────────┐ │ │
│  │  │  17 Edge Functions (Deno)        │ │ │
│  │  │  - woo-proxy (API Gateway)       │ │ │
│  │  │  - sync-woo-products             │ │ │
│  │  │  - bulk-sync-to-woo              │ │ │
│  │  │  - webhook handlers              │ │ │
│  │  │  - AI agents                     │ │ │
│  │  └──────────────────────────────────┘ │ │
│  │  ┌──────────────────────────────────┐ │ │
│  │  │  PostgreSQL Database (32 tables) │ │ │
│  │  │  - stores, products, orders      │ │ │
│  │  │  - taxonomies, attributes        │ │ │
│  │  │  - sync logs, webhooks           │ │ │
│  │  │  - project management            │ │ │
│  │  │  - AI agent insights             │ │ │
│  │  └──────────────────────────────────┘ │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ (with npm)
- Access to Supabase instance
- WooCommerce store with REST API enabled

### Installation

```bash
# Clone the repository
git clone https://github.com/itaymm211010/WooCommerce-SaaS-Dashboard.git
cd WooCommerce-SaaS-Dashboard

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run development server
npm run dev
```

The app will be available at `http://localhost:8080`

### Environment Variables

```bash
# Supabase Connection
VITE_SUPABASE_URL=https://api.ssw-ser.com
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=woopilot

# Optional: AI Features
VITE_OPENROUTER_API_KEY=your-openrouter-key
```

---

## 📁 Project Structure

```
WooCommerce-SaaS-Dashboard/
├── src/
│   ├── components/        # React components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities & helpers
│   ├── pages/            # Page components
│   ├── integrations/     # Supabase integration
│   └── i18n/             # Internationalization
├── supabase/
│   ├── functions/        # 17 Edge Functions (Deno)
│   │   ├── woo-proxy/           # WooCommerce API Gateway
│   │   ├── sync-woo-products/   # Sync from WooCommerce
│   │   ├── bulk-sync-to-woo/    # Bulk upload to WC
│   │   ├── ai-chat/             # AI Assistant
│   │   └── ...                  # 13 more functions
│   ├── migrations/       # Database migrations (48 files)
│   └── functions/shared/ # Shared utilities
├── scripts/              # Automation scripts
│   ├── backup-lovable-db.sh      # DB backup
│   └── import-to-new-supabase.sh # DB import
├── docs/
│   ├── MIGRATION_PLAN.md         # Migration strategy
│   ├── DATABASE_SCHEMA.md        # Complete DB schema
│   ├── COOLIFY_SUPABASE_SETUP.md # Deployment guide
│   └── WOOPILOT_CONFIG.md        # Configuration
└── package.json
```

---

## 🗄️ Database Schema

**Complete Documentation:** See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)

**Statistics:**
- 32 Tables
- 4 Views
- 13 Functions
- 29 Triggers
- 108+ Indexes
- 100+ RLS Policies
- 48 Migration Files

**Key Tables:**
- `stores` - WooCommerce store credentials
- `products` - Product catalog with variations
- `orders` - Order history with PII protection
- `store_categories`, `store_tags`, `store_brands` - Taxonomies
- `sync_logs`, `webhook_logs` - Audit trails
- `tasks`, `sprints`, `bug_reports` - Project management
- `agent_insights`, `agent_alerts` - AI system

---

## 🔐 Security

### Multi-Tenant Isolation
- Row Level Security (RLS) on all 32 tables
- Store-level data isolation
- User cannot access other users' stores

### Role-Based Access Control
- **Admin:** Full system access
- **Owner:** Full access to owned stores
- **Manager:** Read/write products, orders (no credentials)
- **Viewer:** Read-only, PII masked

### Data Protection
- Encrypted WooCommerce credentials
- PII masking for viewer role (orders_summary view)
- Credential access logging
- Webhook signature verification (HMAC SHA256)
- SQL injection prevention
- Audit logging on 14 critical tables

### Rate Limiting
- Webhook logs: 1000/hour per store
- Failed login attempts tracking

---

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start dev server (port 8080)
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Edge Functions Development

Edge Functions run on Deno runtime:

```bash
# Deploy a function (when using Supabase CLI)
supabase functions deploy woo-proxy

# Test locally (requires Supabase CLI + Docker)
supabase functions serve
```

### Database Migrations

All migrations are in `supabase/migrations/`:

```bash
# Apply migrations (on self-hosted Supabase)
psql -h <host> -U postgres -d postgres -f supabase/migrations/*.sql
```

---

## 🚢 Deployment

### Current Setup (Coolify + Hetzner)

**Server:** Hetzner (91.99.207.249)
**Orchestration:** Coolify
**Domains:**
- Frontend: https://app.ssw-ser.com
- API: https://api.ssw-ser.com
- Studio: https://studio.ssw-ser.com

**Deployment Guide:** See [COOLIFY_SUPABASE_SETUP.md](./COOLIFY_SUPABASE_SETUP.md)

### Frontend Deployment

```bash
# Build for production
npm run build

# Deploy to Coolify
# (Coolify auto-deploys from git push)
git push origin main
```

### Backend Deployment

Supabase is deployed via Docker Compose in Coolify:
- PostgreSQL (database)
- PostgREST (REST API)
- GoTrue (authentication)
- Realtime (WebSockets)
- Storage API
- Supabase Studio (UI)

---

## 📊 Monitoring

### Grafana Dashboards
- Database connections
- API response times
- Error rates
- Sync job status
- Resource usage (CPU, RAM, Disk)

### Logs & Alerts
- Sync error notifications
- Failed webhook deliveries
- AI agent anomaly detection
- Deployment status tracking

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Supabase](https://supabase.com/) - Backend infrastructure
- [Shadcn/UI](https://ui.shadcn.com/) - UI components
- [WooCommerce](https://woocommerce.com/) - E-commerce platform
- [Coolify](https://coolify.io/) - Self-hosted Heroku alternative
- [Hetzner](https://www.hetzner.com/) - Reliable hosting

---

## 📞 Support

- **Documentation:** [docs/](./docs/)
- **Issues:** [GitHub Issues](https://github.com/itaymm211010/WooCommerce-SaaS-Dashboard/issues)
- **Migration Guide:** [MIGRATION_PLAN.md](./MIGRATION_PLAN.md)

---

**Made with ❤️ by the WooPilot Team**

*Put Your WooCommerce on Autopilot* ✈️
