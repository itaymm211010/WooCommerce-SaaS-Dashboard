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

**📊 Full Schema Documentation:** See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)

**Summary Statistics:**
- **Tables:** 32
- **Views:** 4
- **Functions:** 13
- **Triggers:** 29
- **Indexes:** 108+
- **RLS Policies:** 100+
- **Enums:** 3
- **Migration Files:** 48

**Table Categories:**

1. **User Management (3):** profiles, user_roles, store_users
2. **Store Management (1):** stores
3. **Product Management (5):** products, product_images, product_variations, product_attributes, store_attributes
4. **Taxonomy (4):** store_categories, store_tags, store_brands, store_attribute_terms
5. **Orders (2):** orders, order_status_logs
6. **Webhooks (2):** webhooks, webhook_logs
7. **Sync (3):** taxonomy_sync_log, sync_logs, sync_errors
8. **Project Management (8):** sprints, tasks, work_logs, task_comments, project_alerts, task_logs, bug_reports, deployments
9. **AI Agents (3):** agent_insights, agent_alerts, agent_execution_log
10. **Security (4):** credential_access_logs, webhook_log_rate_limit, audit_logs, anomaly_response_actions

**Critical Security Features:**
- ✅ **RLS enabled on all 32 tables**
- ✅ **Multi-tenant isolation** (store-level access control)
- ✅ **Role-based permissions** (admin, owner, manager, viewer)
- ✅ **PII masking** for viewers (orders_summary view)
- ✅ **Audit logging** (14 tables monitored)
- ✅ **Webhook rate limiting** (1000/hour per store)
- ✅ **Credential access logging**
- ✅ **SQL injection prevention** (SET search_path = public)

**Migrations:**
- Location: `/supabase/migrations/*.sql`
- Total: **48 migration files** (chronological order required!)
- Must be executed sequentially during import

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
