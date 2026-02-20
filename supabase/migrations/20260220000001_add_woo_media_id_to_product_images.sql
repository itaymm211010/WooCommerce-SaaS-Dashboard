-- Add woo_media_id to product_images to track WooCommerce media attachment IDs
-- This prevents duplicate image uploads on every product save

ALTER TABLE product_images
  ADD COLUMN IF NOT EXISTS woo_media_id INTEGER DEFAULT NULL;

COMMENT ON COLUMN product_images.woo_media_id IS 'WooCommerce media attachment ID. When set, use this ID instead of re-uploading the image src on sync.';

CREATE INDEX IF NOT EXISTS idx_product_images_woo_media_id ON product_images(woo_media_id);
