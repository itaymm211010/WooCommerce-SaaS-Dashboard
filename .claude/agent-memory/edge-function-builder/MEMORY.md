# Edge Function Builder Memory

## Project: WooCommerce SaaS Dashboard

## Shared Directory
- Use `../shared/` — NOT `../\_shared/` (was renamed, old name breaks builds)

## Functions Built & Their Patterns
- `woo-proxy`: secure proxy for all frontend→WooCommerce calls
- `generate-webhook-secret`: was missing from config.toml — always register new functions!
- `update-woo-product`: calls `saveWooMediaIds` after create/update to persist woo_media_id
- `sync-woo-products`: saves `woo_media_id` from WooCommerce response on initial pull

## Known Import Issues
- Zod: `https://deno.land/x/zod@v3.22.4/mod.ts` — pinned, works
- Supabase: `https://esm.sh/@supabase/supabase-js@2.75.0` — pinned version preferred
- Std: `https://deno.land/std@0.168.0/http/server.ts`

## config.toml Registration
- Every new function MUST be added to `supabase/config.toml`
- All authenticated functions: `verify_jwt = true`
- Public webhooks only: `verify_jwt = false`
- Missing this = function exists but never deploys (was the generate-webhook-secret bug)

## WooCommerce API Quirks
- Must create parent product before variations
- Images: send `{id: woo_media_id}` for existing, `{src: url}` for new — prevents duplicate media
- Webhook deletion: use PUT with `status: 'deleted'` OR DELETE with `?force=true`
