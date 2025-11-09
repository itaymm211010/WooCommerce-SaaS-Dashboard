# תוכנית מיגרציה: LOVABLE → Coolify + Supabase Self-Hosted

## מטרות המיגרציה

1. ✅ הסרת תלות ב-LOVABLE Cloud
2. ✅ שליטה מלאה על התשתית
3. ✅ שימוש בשרת Hetzner + Coolify
4. ✅ **אפס שינויי קוד** (שמירה על ארכיטקטורה קיימת)

---

## מפרט השרת

**Hetzner Server:**
- CPU: 4 vCPU
- RAM: 8 GB
- Disk: 80 GB SSD
- OS: Linux (עם Coolify מותקן)

**דרישות Supabase:**
- מינימום: 4GB RAM ✅
- מומלץ: 8GB RAM ✅
- נמצא במפרט המושלם!

---

## ארכיטקטורה נוכחית (LOVABLE)

```
┌─────────────────────┐
│   GitHub Repo       │
│ (Source of Truth)   │
└──────────┬──────────┘
           │
           │ git push
           ▼
┌─────────────────────┐
│   LOVABLE Cloud     │ ← נקודת התלות שרוצים להסיר
│  - Auto Deploy      │
│  - Build Pipeline   │
└──────────┬──────────┘
           │
           ├──────────────┐
           ▼              ▼
┌─────────────────┐  ┌─────────────────┐
│  Frontend       │  │  Supabase       │
│  (Static)       │  │  - PostgreSQL   │
│  - React 18     │  │  - Edge Funcs   │
│  - Vite         │  │  - Auth         │
└─────────────────┘  └─────────────────┘
```

---

## ארכיטקטורה חדשה (Coolify)

```
┌─────────────────────┐
│   GitHub Repo       │
│ (Source of Truth)   │
└──────────┬──────────┘
           │
           │ git push
           ▼
┌─────────────────────────────────────┐
│        Hetzner Server               │
│                                     │
│  ┌──────────────────────────────┐  │
│  │         Coolify              │  │
│  │  - Auto Deploy               │  │
│  │  - Docker Orchestration      │  │
│  └──────────┬───────────────────┘  │
│             │                       │
│             ├──────────────┐        │
│             ▼              ▼        │
│  ┌──────────────┐  ┌──────────────┐│
│  │  Frontend    │  │  Supabase    ││
│  │  (Docker)    │  │  (Docker)    ││
│  │  - React     │  │  - Postgres  ││
│  │  - Nginx     │  │  - PostgREST ││
│  └──────────────┘  │  - Deno      ││
│                    │  - Auth      ││
│  ┌──────────────┐  └──────────────┘│
│  │  Grafana     │                  │
│  │  Monitoring  │                  │
│  └──────────────┘                  │
└─────────────────────────────────────┘
```

---

## רכיבי הפרויקט הקיימים

### Frontend (React + Vite)

**טכנולוגיות:**
- React 18.3.1
- TypeScript 5.5.3
- Vite 5.4.1 (SWC)
- TanStack Query 5.56.2
- Shadcn/UI (Radix + Tailwind)
- React Router 6.26.2
- Zod 3.23.8 (validation)
- i18next 25.6.0 (internationalization)

**קבצי קונפיגורציה:**
- `vite.config.ts`
- `tsconfig.json`
- `tailwind.config.ts`
- `.env` (משתני סביבה)

**Build:**
```bash
npm run build
# Output: dist/
```

---

### Backend (Supabase Edge Functions - Deno)

**Runtime:** Deno (לא Node.js!)

**17 Edge Functions:**

| Function | Purpose | Auth Required | Critical |
|----------|---------|---------------|----------|
| `woo-proxy` | WooCommerce API proxy | ✅ | 🔴 CRITICAL |
| `sync-woo-products` | Sync products from WC | ✅ | 🔴 CRITICAL |
| `bulk-sync-to-woo` | Bulk upload to WC | ✅ | 🔴 CRITICAL |
| `update-woo-product` | Update single product | ✅ | 🔴 CRITICAL |
| `sync-taxonomies` | Sync categories/tags | ✅ | 🟡 IMPORTANT |
| `sync-global-attributes` | Sync attributes | ✅ | 🟡 IMPORTANT |
| `woocommerce-order-status` | Webhook handler | ⚪ Public | 🔴 CRITICAL |
| `manage-taxonomy` | CRUD for taxonomies | ✅ | 🟢 NORMAL |
| `reset-user-password` | Password reset | ✅ | 🟢 NORMAL |
| `handle-anomaly-response` | AI anomaly handler | ✅ | 🟢 NORMAL |
| `ai-chat` | AI chat (Gemini) | ✅ | 🟢 NORMAL |
| `agent-coordinator` | Multi-agent orchestration | ✅ | 🟢 NORMAL |
| `sync-health-agent` | Health monitoring | ✅ | 🟢 NORMAL |
| `detect-bugs` | Bug detection | ✅ | 🟢 NORMAL |
| `generate-webhook-secret` | Generate secrets | ✅ | 🟢 NORMAL |

**Shared Utilities:**
- `auth-middleware.ts` - Authentication/Authorization
- `store-utils.ts` - Secure credential access
- `validation-schemas.ts` - Zod schemas
- `webhook-middleware.ts` - HMAC verification
- `woocommerce-utils.ts` - WC API helpers
- `sync-logger.ts` - Audit logging

---

### Database Schema (PostgreSQL)

**Core Tables:**

```sql
-- Multi-tenant stores
stores (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  name TEXT,
  url TEXT,
  consumer_key TEXT (encrypted),
  consumer_secret TEXT (encrypted),
  created_at TIMESTAMPTZ
)

-- Products
products (
  id UUID PRIMARY KEY,
  store_id UUID REFERENCES stores,
  woo_id INTEGER,
  name TEXT,
  sku TEXT,
  price NUMERIC,
  stock_quantity INTEGER,
  source TEXT ('woo' | 'local'),
  synced_at TIMESTAMPTZ,
  UNIQUE(store_id, woo_id)
)

-- Product Variations
product_variations (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products,
  woo_id INTEGER,
  sku TEXT,
  price NUMERIC,
  attributes JSONB,
  synced_at TIMESTAMPTZ
)

-- Product Images
product_images (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products,
  woo_id INTEGER,
  src TEXT,
  position INTEGER,
  synced_at TIMESTAMPTZ
)

-- Taxonomies (Categories, Tags, Brands)
taxonomies (
  id UUID PRIMARY KEY,
  store_id UUID REFERENCES stores,
  woo_id INTEGER,
  name TEXT,
  slug TEXT,
  type TEXT ('category' | 'tag' | 'brand'),
  parent_id UUID,
  synced_at TIMESTAMPTZ
)

-- Attributes (Color, Size, etc.)
store_attributes (
  id UUID PRIMARY KEY,
  store_id UUID REFERENCES stores,
  woo_id INTEGER,
  name TEXT,
  slug TEXT,
  type TEXT,
  synced_at TIMESTAMPTZ
)

store_attribute_terms (
  id UUID PRIMARY KEY,
  attribute_id UUID REFERENCES store_attributes,
  woo_id INTEGER,
  name TEXT,
  slug TEXT,
  synced_at TIMESTAMPTZ
)

-- Orders
orders (
  id UUID PRIMARY KEY,
  store_id UUID REFERENCES stores,
  woo_id INTEGER,
  status TEXT,
  total NUMERIC,
  customer_email TEXT,
  customer_name TEXT,
  billing_address JSONB,
  shipping_address JSONB,
  created_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ
)

-- Order Status Logs
order_status_logs (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders,
  old_status TEXT,
  new_status TEXT,
  changed_at TIMESTAMPTZ
)

-- Audit Logs
sync_logs (
  id UUID PRIMARY KEY,
  store_id UUID REFERENCES stores,
  operation TEXT,
  entity_type TEXT,
  entity_id TEXT,
  status TEXT,
  details JSONB,
  created_at TIMESTAMPTZ
)

webhook_logs (
  id UUID PRIMARY KEY,
  store_id UUID REFERENCES stores,
  event TEXT,
  payload JSONB,
  verified BOOLEAN,
  processed BOOLEAN,
  created_at TIMESTAMPTZ
)

credential_access_logs (
  id UUID PRIMARY KEY,
  store_id UUID REFERENCES stores,
  user_id UUID,
  action TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ
)
```

**RLS Policies:**
- ✅ Multi-tenant isolation per user
- ✅ Manager vs Viewer roles
- ✅ PII masking for viewers (orders_summary view)

**Migrations:**
- Location: `/supabase/migrations/*.sql`
- Total: ~20 migration files
- Must be imported to new Supabase

---

## משתני סביבה (Environment Variables)

### Frontend (.env)
```bash
# Supabase Connection
VITE_SUPABASE_URL=https://ddwlhgpugjyruzejggoz.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...
VITE_SUPABASE_PROJECT_ID=ddwlhgpugjyruzejggoz

# Optional
VITE_OPENROUTER_API_KEY=sk-or-...
```

### Backend (Supabase Edge Functions)
```bash
# Auto-injected by Supabase
SUPABASE_URL=https://ddwlhgpugjyruzejggoz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... (SECRET!)

# Custom (set in LOVABLE dashboard)
OPENROUTER_API_KEY=sk-or-... (optional for AI features)
LOVABLE_API_KEY=... (used in ai-chat function)
```

---

## תוכנית ביצוע (7 ימים)

### יום 1: הכנה
- [x] תיעוד ארכיטקטורה נוכחית ✅
- [ ] הכנת סקריפט גיבוי DB
- [ ] רשימת כל משתני הסביבה
- [ ] בדיקת Coolify (גישה, מפרט)

### יום 2: הקמת Supabase על Coolify
- [ ] התקנת Supabase ב-Coolify (Docker template)
- [ ] הגדרת PostgreSQL
- [ ] הגדרת PostgREST API
- [ ] הגדרת Supabase Auth
- [ ] הגדרת Realtime (אם נדרש)

### יום 3: העברת Database
- [ ] ייצוא DB מ-LOVABLE (pg_dump)
- [ ] ייבוא schema ל-Supabase החדש
- [ ] ייבוא data
- [ ] בדיקת data integrity (row counts)
- [ ] בדיקת RLS policies

### יום 4: העברת Edge Functions
- [ ] Copy `/supabase/functions/` → Supabase החדש
- [ ] הגדרת משתני סביבה ב-Coolify
- [ ] Deploy כל 17 Functions
- [ ] בדיקה פונקציה אחר פונקציה
- [ ] בדיקת authentication

### יום 5: Frontend
- [ ] עדכון `.env` (URL החדש של Supabase)
- [ ] Build: `npm run build`
- [ ] Deploy ל-Coolify (Dockerfile או static)
- [ ] הגדרת domain/subdomain
- [ ] בדיקות integration מלאות

### יום 6: Testing & QA
- [ ] בדיקת sync מוצרים מ-WooCommerce
- [ ] בדיקת sync מוצרים אל WooCommerce
- [ ] בדיקת webhooks (order status)
- [ ] בדיקת authentication + authorization
- [ ] בדיקת AI features (chat, anomaly detection)
- [ ] בדיקות performance

### יום 7: Monitoring & Production
- [ ] הגדרת Grafana ב-Coolify
- [ ] הגדרת dashboards (CPU, RAM, DB connections)
- [ ] הגדרת גיבויים אוטומטיים (pg_dump cron)
- [ ] הגדרת alerts (email/webhook)
- [ ] תיעוד למשתמשים
- [ ] Go Live! 🚀

---

## סיכונים ואסטרטגיות צמצום

| סיכון | השפעה | סבירות | צמצום |
|-------|--------|---------|-------|
| איבוד נתונים במיגרציה | 🔴 HIGH | 🟢 LOW | גיבוי מלא לפני, בדיקת integrity אחרי |
| Edge Functions לא עובדות | 🟡 MED | 🟡 MED | בדיקה פונקציה אחר פונקציה, שמירת LOVABLE כ-fallback |
| Downtime ממושך | 🟡 MED | 🟢 LOW | מיגרציה ב-staging תחילה |
| בעיות performance | 🟢 LOW | 🟡 MED | Monitoring עם Grafana, scaling אם נדרש |
| בעיות RLS/Auth | 🟡 MED | 🟢 LOW | בדיקות יסודיות לפני production |

---

## Rollback Plan

אם משהו משתבש:

1. **Frontend:** שינוי `.env` חזרה ל-LOVABLE URL
2. **Database:** LOVABLE DB עדיין קיים (לא נמחק!)
3. **Edge Functions:** LOVABLE Functions עדיין רצות
4. **זמן rollback:** < 5 דקות

**חשוב:** לא למחוק שום דבר ב-LOVABLE עד שהכל עובד 100% על Coolify!

---

## Checklist סופי לפני Go-Live

- [ ] כל הטבלאות בDB קיימות
- [ ] כל ה-17 Edge Functions רצות
- [ ] RLS policies פעילות
- [ ] Authentication עובד
- [ ] WooCommerce sync עובד (שני כיוונים)
- [ ] Webhooks מקבלים נתונים
- [ ] AI features עובדות
- [ ] Performance טוב (< 2s response time)
- [ ] Backups מוגדרים
- [ ] Monitoring פעיל
- [ ] Documentation עדכני

---

## קישורים חשובים

**Documentation:**
- Supabase Self-Hosting: https://supabase.com/docs/guides/self-hosting
- Coolify Docs: https://coolify.io/docs
- Deno Deploy (Edge Functions): https://deno.com/deploy/docs

**GitHub:**
- Current Repo: https://github.com/itaymm211010/WooCommerce-SaaS-Dashboard
- Branch: `claude/project-planning-discussion-011CUxyJJDkEPEtZX5j4DgSk`

**LOVABLE (current):**
- Project ID: `bf95ed21-9695-47bb-bea2-c1f45246d48b`
- Supabase Project: `ddwlhgpugjyruzejggoz`

---

**עדכון אחרון:** 2025-11-09
**סטטוס:** 📝 Planning Phase
