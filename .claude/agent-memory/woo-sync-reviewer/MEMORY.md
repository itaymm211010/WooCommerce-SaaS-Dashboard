# Woo Sync Reviewer Memory

## Project: WooCommerce SaaS Dashboard

## Bugs Fixed (reference for pattern detection)

### Duplicate Image Uploads (Fixed 2026-02-20)
- **Root cause**: `transformProductForWooCommerce` always sent `{src: url}` — WooCommerce created new media each time
- **Fix**: Added `woo_media_id` column to `product_images`. Now sends `{id: woo_media_id}` when available
- **Files**: `update-woo-product/product.ts`, `update-woo-product/handlers.ts`, `sync-woo-products/products.ts`
- **Pattern to watch**: Any code that sends images to WooCommerce — check for `woo_media_id` usage

### Orders Page Bugs (Fixed 2026-02-22)

#### billing null crash
- **Root cause**: `syncOrders` in `orders/index.tsx` accessed `order.billing.first_name` directly — crashes on guest checkout (billing = null)
- **Fix**: `order.billing?.first_name ?? ''` with fallback to `'Guest'`
- **Pattern to watch**: Any code mapping WooCommerce order objects — always use optional chaining on `billing`, `shipping`, `line_items`

#### Select uncontrolled (status not updating in UI)
- **Root cause**: `DesktopOrdersTable` and `MobileOrderCard` used `defaultValue={order.status}` on shadcn Select — uncontrolled, doesn't re-render after refetch
- **Fix**: Changed to `value={order.status ?? undefined}` (controlled)
- **Pattern to watch**: Any shadcn `Select` that displays server data — must use `value`, never `defaultValue`

#### allowedStatusTransitions too restrictive
- **Root cause**: `cancelled` only allowed → `['processing']`. Blocked valid WooCommerce transition cancelled→pending
- **Fix**: `cancelled: ['pending', 'processing', 'on-hold']`
- **Pattern to watch**: Status transition logic must match WooCommerce's actual allowed transitions

#### View History race condition + no loading state
- **Root cause**: Dialog opened immediately (uncontrolled), query fired async, no spinner — showed "No status changes" before data arrived
- **Fix**: Added `isLoadingStatusLogs` prop passed through OrdersTable → DesktopOrdersTable/MobileOrderCard, shows Loader2 spinner while loading
- **Secondary fix**: After status change, always call `setSelectedOrderId(orderId)` + `refetchLogs()` so logs are pre-fetched

## High-Risk Files (extra attention needed)
- `supabase/functions/update-woo-product/product.ts` — transforms data before WooCommerce push
- `supabase/functions/sync-woo-products/products.ts` — upsert logic for pull sync
- Any new sync function for images

## Confirmed Working Patterns
- `saveProducts` uses `upsert` with `onConflict: 'product_id,original_url'` — idempotent ✅
- `handlers.ts` calls `saveWooMediaIds` after create/update — saves media IDs back ✅
- Variations checked by `woo_id` then by `sku` before insert — prevents duplicates ✅
