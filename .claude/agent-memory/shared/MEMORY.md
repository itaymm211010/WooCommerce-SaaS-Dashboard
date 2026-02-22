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
