-- Add unique constraint to product_images to prevent duplicate images
-- This ensures idempotency when syncing images from WooCommerce

-- First, remove any existing duplicates before adding the constraint
-- Keep only the most recent record for each (product_id, original_url) combination
DELETE FROM product_images
WHERE id NOT IN (
  SELECT DISTINCT ON (product_id, original_url) id
  FROM product_images
  ORDER BY product_id, original_url, created_at DESC
);

-- Add the unique constraint
ALTER TABLE product_images
ADD CONSTRAINT product_images_product_original_url_unique
UNIQUE (product_id, original_url);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_product_images_product_original_url
ON product_images(product_id, original_url);

COMMENT ON CONSTRAINT product_images_product_original_url_unique ON product_images
IS 'Ensures each image URL is unique per product, preventing duplicates during sync';
