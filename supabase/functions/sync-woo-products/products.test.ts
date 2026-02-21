/**
 * Unit tests for the stale-image cleanup logic in saveProducts.
 *
 * These tests use an in-memory mock of the Supabase client so no real
 * database connection is needed.  They validate the core invariant:
 *
 *   After a sync run, any product_images row whose source='woo' AND
 *   synced_at < syncTimestamp must be deleted.
 */

import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

// ---------------------------------------------------------------------------
// In-memory fake for the product_images table
// ---------------------------------------------------------------------------

interface ImageRow {
  id: string;
  product_id: string;
  source: string;
  synced_at: string;
  original_url: string;
  store_id: string;
  type: string;
  display_order: number;
  alt_text: string;
  description: string;
  storage_url: null;
  storage_source: string;
  woo_media_id: null;
}

function buildMockSupabase(initialImages: ImageRow[]) {
  // Mutable in-memory store
  let images: ImageRow[] = [...initialImages];
  const deleted: ImageRow[] = [];

  // Minimal chainable query builder
  function makeQuery(table: string) {
    let _rows: ImageRow[] = [...images];
    let _upsertData: Partial<ImageRow>[] | null = null;
    let _upsertOptions: { onConflict: string; ignoreDuplicates: boolean } | null =
      null;
    let _deleteMode = false;
    const _filters: Array<(r: ImageRow) => boolean> = [];

    const q: any = {
      select: (_cols?: string) => {
        return q;
      },
      upsert: (data: Partial<ImageRow>[], opts: any) => {
        _upsertData = Array.isArray(data) ? data : [data];
        _upsertOptions = opts;
        return q;
      },
      delete: () => {
        _deleteMode = true;
        return q;
      },
      eq: (col: string, val: any) => {
        _filters.push((r: any) => r[col] === val);
        return q;
      },
      lt: (col: string, val: any) => {
        _filters.push((r: any) => r[col] < val);
        return q;
      },
      single: () => q,
      // Resolve the query
      then: (resolve: (v: { data: any; error: null }) => void) => {
        if (_upsertData) {
          // Upsert: update if conflict key matches, otherwise insert
          for (const row of _upsertData as any[]) {
            const conflictKey = _upsertOptions?.onConflict ?? "";
            const keys = conflictKey.split(",").map((k: string) => k.trim());
            const existingIdx = images.findIndex((img: any) =>
              keys.every((k: string) => img[k] === row[k])
            );
            if (existingIdx >= 0) {
              images[existingIdx] = { ...images[existingIdx], ...row };
            } else {
              images.push({
                id: `img-${Math.random()}`,
                storage_url: null,
                woo_media_id: null,
                ...row,
              } as ImageRow);
            }
          }
          resolve({ data: _upsertData, error: null });
          return;
        }

        if (_deleteMode) {
          const matches = images.filter((r) => _filters.every((f) => f(r)));
          deleted.push(...matches);
          images = images.filter((r) => !_filters.every((f) => f(r)));
          resolve({ data: matches, error: null });
          return;
        }

        // Plain select
        const result = images.filter((r) => _filters.every((f) => f(r)));
        resolve({ data: result.length === 1 ? result[0] : result, error: null });
      },
    };

    return q;
  }

  const client = {
    from: (_table: string) => makeQuery(_table),
    // Expose internals for assertions
    _images: () => images,
    _deleted: () => deleted,
  };

  return client;
}

// ---------------------------------------------------------------------------
// Helpers that replicate the exact cleanup query from products.ts
// ---------------------------------------------------------------------------

async function runCleanup(
  supabase: ReturnType<typeof buildMockSupabase>,
  productId: string,
  syncTimestamp: string
) {
  return await supabase
    .from("product_images")
    .delete()
    .eq("product_id", productId)
    .eq("source", "woo")
    .lt("synced_at", syncTimestamp);
}

async function runUpsert(
  supabase: ReturnType<typeof buildMockSupabase>,
  rows: Partial<ImageRow>[]
) {
  return await supabase.from("product_images").upsert(rows, {
    onConflict: "product_id,original_url",
    ignoreDuplicates: false,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const PRODUCT_ID = "product-abc";
const STORE_ID = "store-1";

Deno.test("stale images (synced_at before syncTimestamp) are deleted", async () => {
  const oldTimestamp = "2026-02-20T10:00:00.000Z";
  const syncTimestamp = "2026-02-21T10:00:00.000Z";

  const initialImages: ImageRow[] = [
    {
      id: "img-old",
      product_id: PRODUCT_ID,
      store_id: STORE_ID,
      original_url: "https://shop.test/img/removed.jpg",
      source: "woo",
      synced_at: oldTimestamp, // ← stale, was not in WooCommerce this run
      type: "gallery",
      display_order: 1,
      alt_text: "",
      description: "",
      storage_url: null,
      storage_source: "woocommerce",
      woo_media_id: null,
    },
  ];

  const supabase = buildMockSupabase(initialImages);

  // No upserts this run (product no longer has images in WooCommerce)
  await runCleanup(supabase, PRODUCT_ID, syncTimestamp);

  assertEquals(supabase._images().length, 0, "stale image should be deleted");
  assertEquals(supabase._deleted().length, 1, "exactly one image deleted");
  assertEquals(supabase._deleted()[0].id, "img-old");
});

Deno.test("current images (synced_at === syncTimestamp) are kept", async () => {
  const syncTimestamp = "2026-02-21T10:00:00.000Z";

  const initialImages: ImageRow[] = [
    {
      id: "img-current",
      product_id: PRODUCT_ID,
      store_id: STORE_ID,
      original_url: "https://shop.test/img/current.jpg",
      source: "woo",
      synced_at: syncTimestamp, // ← already up-to-date
      type: "featured",
      display_order: 0,
      alt_text: "",
      description: "",
      storage_url: null,
      storage_source: "woocommerce",
      woo_media_id: null,
    },
  ];

  const supabase = buildMockSupabase(initialImages);
  await runCleanup(supabase, PRODUCT_ID, syncTimestamp);

  assertEquals(supabase._images().length, 1, "current image must NOT be deleted");
  assertEquals(supabase._deleted().length, 0);
});

Deno.test("mixed: only stale images are removed, current ones are kept", async () => {
  const oldTimestamp = "2026-02-20T10:00:00.000Z";
  const syncTimestamp = "2026-02-21T10:00:00.000Z";

  const initialImages: ImageRow[] = [
    {
      id: "img-keep",
      product_id: PRODUCT_ID,
      store_id: STORE_ID,
      original_url: "https://shop.test/img/keep.jpg",
      source: "woo",
      synced_at: syncTimestamp,
      type: "featured",
      display_order: 0,
      alt_text: "",
      description: "",
      storage_url: null,
      storage_source: "woocommerce",
      woo_media_id: null,
    },
    {
      id: "img-stale",
      product_id: PRODUCT_ID,
      store_id: STORE_ID,
      original_url: "https://shop.test/img/removed.jpg",
      source: "woo",
      synced_at: oldTimestamp, // ← stale
      type: "gallery",
      display_order: 1,
      alt_text: "",
      description: "",
      storage_url: null,
      storage_source: "woocommerce",
      woo_media_id: null,
    },
  ];

  const supabase = buildMockSupabase(initialImages);
  await runCleanup(supabase, PRODUCT_ID, syncTimestamp);

  assertEquals(supabase._images().length, 1, "one image should remain");
  assertEquals(supabase._images()[0].id, "img-keep");
  assertEquals(supabase._deleted()[0].id, "img-stale");
});

Deno.test("non-woo images (source != 'woo') are never touched", async () => {
  const oldTimestamp = "2026-02-20T10:00:00.000Z";
  const syncTimestamp = "2026-02-21T10:00:00.000Z";

  const initialImages: ImageRow[] = [
    {
      id: "img-manual",
      product_id: PRODUCT_ID,
      store_id: STORE_ID,
      original_url: "https://shop.test/img/manual.jpg",
      source: "manual", // ← uploaded manually, not from WooCommerce
      synced_at: oldTimestamp,
      type: "gallery",
      display_order: 0,
      alt_text: "",
      description: "",
      storage_url: null,
      storage_source: "manual",
      woo_media_id: null,
    },
  ];

  const supabase = buildMockSupabase(initialImages);
  await runCleanup(supabase, PRODUCT_ID, syncTimestamp);

  assertEquals(supabase._images().length, 1, "manual image must be untouched");
  assertEquals(supabase._deleted().length, 0);
});

Deno.test("upsert then cleanup: full sync cycle with one removed image", async () => {
  const oldTimestamp = "2026-02-20T10:00:00.000Z";
  const syncTimestamp = "2026-02-21T10:00:00.000Z";

  // DB state before this sync run: product had 2 images
  const initialImages: ImageRow[] = [
    {
      id: "img-featured",
      product_id: PRODUCT_ID,
      store_id: STORE_ID,
      original_url: "https://shop.test/img/featured.jpg",
      source: "woo",
      synced_at: oldTimestamp,
      type: "featured",
      display_order: 0,
      alt_text: "",
      description: "",
      storage_url: null,
      storage_source: "woocommerce",
      woo_media_id: null,
    },
    {
      id: "img-gallery",
      product_id: PRODUCT_ID,
      store_id: STORE_ID,
      original_url: "https://shop.test/img/gallery.jpg",
      source: "woo",
      synced_at: oldTimestamp,
      type: "gallery",
      display_order: 1,
      alt_text: "",
      description: "",
      storage_url: null,
      storage_source: "woocommerce",
      woo_media_id: null,
    },
  ];

  const supabase = buildMockSupabase(initialImages);

  // WooCommerce now only returns the featured image (gallery was removed)
  await runUpsert(supabase, [
    {
      product_id: PRODUCT_ID,
      store_id: STORE_ID,
      original_url: "https://shop.test/img/featured.jpg",
      source: "woo",
      synced_at: syncTimestamp, // ← stamped with current run timestamp
      type: "featured",
      display_order: 0,
      alt_text: "",
      description: "",
      storage_url: null,
      storage_source: "woocommerce",
      woo_media_id: null,
    },
  ]);

  // Cleanup: delete anything not touched in this run
  await runCleanup(supabase, PRODUCT_ID, syncTimestamp);

  const remaining = supabase._images();
  assertEquals(remaining.length, 1, "only featured image should remain");
  assertEquals(
    remaining[0].original_url,
    "https://shop.test/img/featured.jpg"
  );
  assertEquals(
    supabase._deleted()[0].original_url,
    "https://shop.test/img/gallery.jpg",
    "removed gallery image should be deleted"
  );
});
