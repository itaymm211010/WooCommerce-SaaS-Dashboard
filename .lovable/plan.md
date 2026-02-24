

## Fix: Webhook Deletion Returns 400 Bad Request

### Root Cause

Two issues are causing the 400 error:

1. **Schema requires `method` field** -- the `wooProxyRequestSchema` has `method` as required, but the `woo-proxy` code expects it to be optional (uses `method = "GET"` default). This means any call that omits `method` will fail validation. While the delete call does send `method: 'PUT'`, the schema should match the proxy's intent.

2. **Null `woo_webhook_id` sends invalid ID** -- in `WebhooksTable.tsx`, the delete handler calls `deleteWebhook(webhook.woo_webhook_id || 0, store)`. If `woo_webhook_id` is `null`, it sends `0`, creating endpoint `/wp-json/wc/v3/webhooks/0` which WooCommerce rejects with 400.

3. **WooCommerce may reject PUT-based deletion** -- some WooCommerce versions prefer `DELETE` with `?force=true` over `PUT` with `status: 'deleted'`.

### Changes

**1. `supabase/functions/shared/validation-schemas.ts`**
- Make `method` optional with `.default('GET')` so the schema matches the proxy's behavior.

**2. `src/pages/stores/utils/webhookUtils.ts`**
- Change `deleteWebhook` to use `DELETE` method with `params: { force: true }` instead of `PUT` with `status: 'deleted'`.
- Add a guard: if `webhookId` is `0` or falsy, skip the WooCommerce call and only delete from the database.

**3. `src/pages/stores/components/WebhooksTable.tsx`**
- Pass `webhook.woo_webhook_id` directly (allow `null`) instead of coercing to `0`.

### Technical Details

```text
Before:
  deleteWebhook(webhook.woo_webhook_id || 0, store)
    -> PUT /wp-json/wc/v3/webhooks/0  { status: 'deleted' }
    -> WooCommerce returns 400

After:
  deleteWebhook(webhook.woo_webhook_id, store)
    -> if woo_webhook_id is null: skip WooCommerce call, delete DB record only
    -> if woo_webhook_id exists: DELETE /wp-json/wc/v3/webhooks/{id}?force=true
    -> fallback: if DELETE fails, try PUT with status:'deleted'
```

