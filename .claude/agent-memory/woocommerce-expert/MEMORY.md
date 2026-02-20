# WooCommerce Expert Memory

## Project: WooCommerce SaaS Dashboard

## Store-Specific Knowledge
- Uses woo-proxy Edge Function for ALL WooCommerce API calls (never direct from frontend)
- Supabase stores `woo_media_id` per image — always send `{id: woo_media_id}` not `{src}` for existing images
- Multi-tenant: each user owns stores, each store has its own WooCommerce credentials

## Confirmed Working Patterns
- woo_media_id column exists in `product_images` table ✅
- Image update sends `{id: woo_media_id}` when available — prevents duplicate media ✅
- Variations synced after parent product — correct order maintained ✅

## Quirks Found In This Store
(none yet — update as issues are discovered during integration work)

## API Calls Tested & Working
(update as endpoints are confirmed working)
