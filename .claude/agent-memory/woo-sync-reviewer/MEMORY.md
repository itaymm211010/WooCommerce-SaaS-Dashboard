# Woo Sync Reviewer Memory

## Project: WooCommerce SaaS Dashboard

## Bugs Fixed (reference for pattern detection)

### Duplicate Image Uploads (Fixed 2026-02-20)
- **Root cause**: `transformProductForWooCommerce` always sent `{src: url}` — WooCommerce created new media each time
- **Fix**: Added `woo_media_id` column to `product_images`. Now sends `{id: woo_media_id}` when available
- **Files**: `update-woo-product/product.ts`, `update-woo-product/handlers.ts`, `sync-woo-products/products.ts`
- **Pattern to watch**: Any code that sends images to WooCommerce — check for `woo_media_id` usage

## High-Risk Files (extra attention needed)
- `supabase/functions/update-woo-product/product.ts` — transforms data before WooCommerce push
- `supabase/functions/sync-woo-products/products.ts` — upsert logic for pull sync
- Any new sync function for images

## Confirmed Working Patterns
- `saveProducts` uses `upsert` with `onConflict: 'product_id,original_url'` — idempotent ✅
- `handlers.ts` calls `saveWooMediaIds` after create/update — saves media IDs back ✅
- Variations checked by `woo_id` then by `sku` before insert — prevents duplicates ✅
