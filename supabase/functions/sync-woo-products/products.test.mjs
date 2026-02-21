/**
 * Unit tests for the stale-image cleanup logic in saveProducts.
 * Runs with: node --test products.test.mjs
 *
 * Uses an in-memory mock of the Supabase client — no real DB needed.
 * Validates the core invariant:
 *
 *   After a sync run, any product_images row whose source='woo' AND
 *   synced_at < syncTimestamp must be deleted.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

// ---------------------------------------------------------------------------
// In-memory mock Supabase client
// ---------------------------------------------------------------------------

function buildMockSupabase(initialImages) {
  let images = [...initialImages];
  const deleted = [];

  function makeQuery() {
    let _upsertData = null;
    let _upsertConflictKey = null;
    let _deleteMode = false;
    const _filters = [];

    const q = {
      select: () => q,
      upsert: (data, opts) => {
        _upsertData = Array.isArray(data) ? data : [data];
        _upsertConflictKey = opts?.onConflict ?? "";
        return q;
      },
      delete: () => {
        _deleteMode = true;
        return q;
      },
      eq: (col, val) => {
        _filters.push((r) => r[col] === val);
        return q;
      },
      lt: (col, val) => {
        _filters.push((r) => r[col] < val);
        return q;
      },
      single: () => q,
      then: (resolve) => {
        // Upsert
        if (_upsertData) {
          const keys = _upsertConflictKey.split(",").map((k) => k.trim());
          for (const row of _upsertData) {
            const idx = images.findIndex((img) =>
              keys.every((k) => img[k] === row[k])
            );
            if (idx >= 0) {
              images[idx] = { ...images[idx], ...row };
            } else {
              images.push({ id: `img-${Math.random()}`, ...row });
            }
          }
          resolve({ data: _upsertData, error: null });
          return;
        }

        // Delete
        if (_deleteMode) {
          const matches = images.filter((r) => _filters.every((f) => f(r)));
          deleted.push(...matches);
          images = images.filter((r) => !_filters.every((f) => f(r)));
          resolve({ data: matches, error: null });
          return;
        }

        // Select
        const result = images.filter((r) => _filters.every((f) => f(r)));
        resolve({ data: result.length === 1 ? result[0] : result, error: null });
      },
    };
    return q;
  }

  return {
    from: () => makeQuery(),
    _images: () => images,
    _deleted: () => deleted,
  };
}

// ---------------------------------------------------------------------------
// Helpers — mirror the exact queries in products.ts
// ---------------------------------------------------------------------------

async function runCleanup(supabase, productId, syncTimestamp) {
  return await supabase
    .from("product_images")
    .delete()
    .eq("product_id", productId)
    .eq("source", "woo")
    .lt("synced_at", syncTimestamp);
}

async function runUpsert(supabase, rows) {
  return await supabase
    .from("product_images")
    .upsert(rows, { onConflict: "product_id,original_url", ignoreDuplicates: false });
}

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const PRODUCT_ID = "product-abc";
const STORE_ID = "store-1";
const OLD_TS = "2026-02-20T10:00:00.000Z";
const SYNC_TS = "2026-02-21T10:00:00.000Z";

function makeImage(overrides) {
  return {
    id: `img-${Math.random()}`,
    product_id: PRODUCT_ID,
    store_id: STORE_ID,
    original_url: "https://shop.test/img/default.jpg",
    source: "woo",
    synced_at: OLD_TS,
    type: "gallery",
    display_order: 0,
    alt_text: "",
    description: "",
    storage_url: null,
    storage_source: "woocommerce",
    woo_media_id: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test("stale image (synced_at < syncTimestamp) is deleted", async () => {
  const supabase = buildMockSupabase([
    makeImage({ id: "img-old", synced_at: OLD_TS }),
  ]);

  await runCleanup(supabase, PRODUCT_ID, SYNC_TS);

  assert.equal(supabase._images().length, 0, "stale image should be gone");
  assert.equal(supabase._deleted().length, 1);
  assert.equal(supabase._deleted()[0].id, "img-old");
});

test("current image (synced_at === syncTimestamp) is kept", async () => {
  const supabase = buildMockSupabase([
    makeImage({ id: "img-current", synced_at: SYNC_TS }),
  ]);

  await runCleanup(supabase, PRODUCT_ID, SYNC_TS);

  assert.equal(supabase._images().length, 1, "current image must remain");
  assert.equal(supabase._deleted().length, 0);
});

test("mixed: only stale images removed, current ones kept", async () => {
  const supabase = buildMockSupabase([
    makeImage({ id: "img-keep", synced_at: SYNC_TS, type: "featured" }),
    makeImage({ id: "img-stale", synced_at: OLD_TS, type: "gallery" }),
  ]);

  await runCleanup(supabase, PRODUCT_ID, SYNC_TS);

  assert.equal(supabase._images().length, 1);
  assert.equal(supabase._images()[0].id, "img-keep");
  assert.equal(supabase._deleted()[0].id, "img-stale");
});

test("non-woo images (source != 'woo') are never deleted", async () => {
  const supabase = buildMockSupabase([
    makeImage({ id: "img-manual", source: "manual", synced_at: OLD_TS }),
  ]);

  await runCleanup(supabase, PRODUCT_ID, SYNC_TS);

  assert.equal(supabase._images().length, 1, "manual image untouched");
  assert.equal(supabase._deleted().length, 0);
});

test("full sync cycle: upsert then cleanup removes removed image", async () => {
  // DB before sync: product has 2 images
  const supabase = buildMockSupabase([
    makeImage({
      id: "img-featured",
      original_url: "https://shop.test/img/featured.jpg",
      synced_at: OLD_TS,
      type: "featured",
    }),
    makeImage({
      id: "img-gallery",
      original_url: "https://shop.test/img/gallery.jpg",
      synced_at: OLD_TS,
      type: "gallery",
    }),
  ]);

  // WooCommerce now only returns the featured image
  await runUpsert(supabase, [
    makeImage({
      original_url: "https://shop.test/img/featured.jpg",
      synced_at: SYNC_TS,
      type: "featured",
    }),
  ]);

  // Cleanup
  await runCleanup(supabase, PRODUCT_ID, SYNC_TS);

  const remaining = supabase._images();
  assert.equal(remaining.length, 1, "only featured image remains");
  assert.equal(remaining[0].original_url, "https://shop.test/img/featured.jpg");
  assert.equal(
    supabase._deleted()[0].original_url,
    "https://shop.test/img/gallery.jpg"
  );
});
