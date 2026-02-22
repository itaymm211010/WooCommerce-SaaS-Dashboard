# Shared Agent Memory
# Cross-agent knowledge for WooCommerce SaaS Dashboard

## Project Essentials
- Supabase project ID: `ddwlhgpugjyruzejggoz`
- Local dev: `C:\Users\Itay\WooCommerce-SaaS-Dashboard\WooCommerce-fresh\`
- Production: Lovable Cloud → GitHub push → auto-deploy
- DB access: Lovable Cloud → Database → SQL Editor (Phase A)

## Critical Rules (all agents must respect)
1. NEVER access `api_key`/`api_secret` from client-side code
2. ALWAYS use `woo-proxy` for frontend→WooCommerce API calls
3. ALWAYS `withAuth` + `verifyStoreAccess` on Edge Functions
4. ALWAYS RLS on every new table
5. Shared utils are in `../shared/` — NOT `../\_shared/`
6. NEVER commit `.env` to git — verify it's not staged before any commit
7. NEVER read or print contents of `.env` — it contains exposed credentials (see security issue below)

## Sync Field Semantics
- `source = 'woo'`: data originated from WooCommerce
- `source = 'local'`: data created/edited in this dashboard
- `synced_at = NULL`: needs sync to WooCommerce
- `synced_at = timestamp`: successfully synced
- `woo_id`: WooCommerce entity ID (INTEGER)
- `woo_media_id`: WooCommerce media attachment ID (INTEGER, images only)

## Completed Work (agents should not redo this)
- woo_media_id column: added to product_images ✅
- generate-webhook-secret: registered in config.toml ✅
- Webhook UI: rebuilt with 14 topics, Hebrew, per-item loading ✅
- Image delete: implemented in ProductImagesTab ✅
- Orders billing null crash: fixed with optional chaining ✅
- Orders Select uncontrolled: changed defaultValue → value ✅
- Orders allowedStatusTransitions: expanded cancelled transitions ✅
- Orders View History: loading spinner + always refetch after status change ✅

## ⚠️ Open Security Issue (2026-02-22 — NOT YET FIXED)
- `.env` is tracked by git and publicly visible on GitHub `origin/main`
- Exposed: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PUBLISHABLE_KEY`
- **Pending actions (user must complete):**
  - [ ] Rotate Supabase anon key in Lovable Cloud → Project Settings → API
  - [ ] `git filter-repo --path .env --invert-paths --force` + force push
  - [ ] Add `.env` to `.gitignore`
- Until fixed: assume anon key is compromised, verify all tables have RLS enforced
