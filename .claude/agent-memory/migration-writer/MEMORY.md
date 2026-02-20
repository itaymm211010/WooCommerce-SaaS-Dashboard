# Migration Writer Memory

## Project: WooCommerce SaaS Dashboard
- Supabase project ID: `ddwlhgpugjyruzejggoz`
- All tables are multi-tenant via `store_id`
- RLS + service role bypass is mandatory on every table

## Confirmed Patterns

### Tables Added So Far
- `product_images`: has `woo_media_id INTEGER` (added 2026-02-20) to prevent duplicate uploads
  - Unique constraint: `(product_id, original_url)`
  - Index: `idx_product_images_woo_media_id`

## Known Gotchas
- The `stores` table uses `user_id` (not `store_id`) for ownership — RLS on stores table uses `user_id = auth.uid()`
- `store_users` table adds multi-user access per store — some policies may need to check both `stores.user_id` and `store_users`
- Always use `IF NOT EXISTS` guards for idempotent migrations
