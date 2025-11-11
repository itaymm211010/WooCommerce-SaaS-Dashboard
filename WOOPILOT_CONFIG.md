# WooPilot - Migration Configuration

## Project Information

**Project Name:** WooPilot
**Tagline:** "Put Your WooCommerce on Autopilot"

---

## Server Details

**Hetzner Server:**
- IP Address: `91.99.207.249`
- CPU: 4 vCPU
- RAM: 8 GB
- Disk: 80 GB SSD
- Coolify: Installed ✅

---

## DNS Configuration

**Base Domain:** `ssw-ser.com`

**Subdomains:**
```
api.ssw-ser.com      → 91.99.207.249  (Supabase API)
studio.ssw-ser.com   → 91.99.207.249  (Supabase Dashboard)
app.ssw-ser.com      → 91.99.207.249  (WooPilot Frontend)
```

**DNS Status:** ✅ Configured

---

## Services Architecture

```
┌─────────────────────────────────────────────────┐
│         Hetzner Server (91.99.207.249)          │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │            Coolify                       │  │
│  │  (Port 8000 - Management Dashboard)      │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  app.ssw-ser.com                         │  │
│  │  WooPilot Frontend                       │  │
│  │  - React 18 + Vite                       │  │
│  │  - Port: 80/443 (HTTPS)                  │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  api.ssw-ser.com                         │  │
│  │  Supabase API                            │  │
│  │  - PostgREST (REST API)                  │  │
│  │  - GoTrue (Auth)                         │  │
│  │  - Realtime (WebSockets)                 │  │
│  │  - Storage API                           │  │
│  │  - Port: 80/443 (HTTPS)                  │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  studio.ssw-ser.com                      │  │
│  │  Supabase Studio                         │  │
│  │  - Database Management UI                │  │
│  │  - SQL Editor                            │  │
│  │  - Table Editor                          │  │
│  │  - Port: 80/443 (HTTPS)                  │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  PostgreSQL (Internal)                   │  │
│  │  - 32 Tables                             │  │
│  │  - 100+ RLS Policies                     │  │
│  │  - Port: 5432 (internal only)            │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  Grafana (Optional)                      │  │
│  │  - Monitoring & Alerts                   │  │
│  │  - Port: 3000                            │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## SSL/HTTPS

All domains will automatically get SSL certificates from Let's Encrypt via Coolify:
- ✅ `api.ssw-ser.com` → HTTPS
- ✅ `studio.ssw-ser.com` → HTTPS
- ✅ `app.ssw-ser.com` → HTTPS

---

## Current State (LOVABLE)

**Frontend URL:** https://bf95ed21-9695-47bb-bea2-c1f45246d48b.lovableproject.com
**Supabase URL:** https://ddwlhgpugjyruzejggoz.supabase.co
**Supabase Project ID:** ddwlhgpugjyruzejggoz

---

## Target State (After Migration)

**Frontend URL:** https://app.ssw-ser.com
**Supabase URL:** https://api.ssw-ser.com
**Supabase Studio:** https://studio.ssw-ser.com

---

## Migration Checklist

### Phase 1: Setup ✅
- [x] Choose server (Hetzner)
- [x] Install Coolify
- [x] Configure DNS (3 subdomains)
- [x] Choose project name (WooPilot)
- [x] Document architecture

### Phase 2: Supabase Installation (In Progress)
- [ ] Access Coolify Dashboard
- [ ] Install Supabase from template
- [ ] Configure domains in Coolify
- [ ] Generate JWT keys
- [ ] Set environment variables
- [ ] Verify Supabase Studio access
- [ ] Verify API endpoint

### Phase 3: Database Migration
- [ ] Export DB from LOVABLE using backup script
- [ ] Verify backup file integrity
- [ ] Import to new Supabase
- [ ] Verify all 32 tables
- [ ] Verify all RLS policies
- [ ] Test database queries

### Phase 4: Edge Functions
- [ ] Copy all 17 functions to new Supabase
- [ ] Configure environment variables
- [ ] Deploy functions one by one
- [ ] Test each function
- [ ] Verify authentication works

### Phase 5: Frontend
- [ ] Update .env with new Supabase URL
- [ ] Test locally
- [ ] Build for production
- [ ] Deploy to Coolify
- [ ] Configure domain
- [ ] Verify SSL certificate

### Phase 6: Testing
- [ ] Test user authentication
- [ ] Test product sync from WooCommerce
- [ ] Test product sync to WooCommerce
- [ ] Test webhooks
- [ ] Test AI features
- [ ] Test all Edge Functions

### Phase 7: Go Live
- [ ] Final backup of LOVABLE DB
- [ ] Switch DNS (if needed)
- [ ] Monitor for errors
- [ ] Set up Grafana monitoring
- [ ] Configure automated backups
- [ ] Document any issues

---

## Rollback Plan

If anything goes wrong:
1. **Frontend:** Change `.env` back to LOVABLE URL → redeploy (5 minutes)
2. **Database:** LOVABLE DB still exists, nothing deleted
3. **Edge Functions:** LOVABLE functions still running
4. **Total Rollback Time:** < 10 minutes

**Important:** Do NOT delete anything in LOVABLE until WooPilot is 100% working on Coolify!

---

## Environment Variables

### Frontend (.env)
```bash
# OLD (LOVABLE):
VITE_SUPABASE_URL=https://ddwlhgpugjyruzejggoz.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<old-key>

# NEW (Coolify):
VITE_SUPABASE_URL=https://api.ssw-ser.com
VITE_SUPABASE_PUBLISHABLE_KEY=<new-anon-key>
VITE_SUPABASE_PROJECT_ID=woopilot
```

### Backend (Supabase Edge Functions)
```bash
# Auto-injected by Supabase:
SUPABASE_URL=https://api.ssw-ser.com
SUPABASE_SERVICE_ROLE_KEY=<new-service-role-key>

# Custom (copy from LOVABLE):
OPENROUTER_API_KEY=<from-lovable>
LOVABLE_API_KEY=<from-lovable>  # For ai-chat function
```

---

## Next Steps

1. **Access Coolify Dashboard:**
   ```
   http://91.99.207.249:8000
   or
   https://<your-coolify-domain>
   ```

2. **Install Supabase** (follow COOLIFY_SUPABASE_SETUP.md)

3. **Export Database** from LOVABLE:
   ```bash
   ./scripts/backup-lovable-db.sh
   ```

4. **Import to new Supabase:**
   ```bash
   ./scripts/import-to-new-supabase.sh backups/lovable-backup-*.sql.gz
   ```

---

**Status:** Ready to start Supabase installation
**Date:** 2025-11-11
**Estimated Time to Complete:** 1-2 days
