-- Add sync tracking fields to core tables
-- These fields enable conflict resolution and prevent infinite sync loops

-- Create enum for data source
CREATE TYPE data_source AS ENUM ('woo', 'local');

-- Add fields to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS source data_source DEFAULT 'local',
ADD COLUMN IF NOT EXISTS synced_at timestamp with time zone;

-- Add fields to product_variations table
ALTER TABLE product_variations
ADD COLUMN IF NOT EXISTS source data_source DEFAULT 'local',
ADD COLUMN IF NOT EXISTS synced_at timestamp with time zone;

-- Add fields to product_attributes table
ALTER TABLE product_attributes
ADD COLUMN IF NOT EXISTS source data_source DEFAULT 'local',
ADD COLUMN IF NOT EXISTS synced_at timestamp with time zone;

-- Add fields to product_images table
ALTER TABLE product_images
ADD COLUMN IF NOT EXISTS source data_source DEFAULT 'local',
ADD COLUMN IF NOT EXISTS synced_at timestamp with time zone;

-- Add fields to store_categories table
ALTER TABLE store_categories
ADD COLUMN IF NOT EXISTS source data_source DEFAULT 'local',
ADD COLUMN IF NOT EXISTS synced_at timestamp with time zone;

-- Add fields to store_tags table
ALTER TABLE store_tags
ADD COLUMN IF NOT EXISTS source data_source DEFAULT 'local',
ADD COLUMN IF NOT EXISTS synced_at timestamp with time zone;

-- Add fields to store_attributes table
ALTER TABLE store_attributes
ADD COLUMN IF NOT EXISTS source data_source DEFAULT 'local',
ADD COLUMN IF NOT EXISTS synced_at timestamp with time zone;

-- Add fields to store_attribute_terms table
ALTER TABLE store_attribute_terms
ADD COLUMN IF NOT EXISTS source data_source DEFAULT 'local',
ADD COLUMN IF NOT EXISTS synced_at timestamp with time zone;

-- Create indexes for faster queries on synced_at
CREATE INDEX IF NOT EXISTS idx_products_synced_at ON products(synced_at);
CREATE INDEX IF NOT EXISTS idx_product_variations_synced_at ON product_variations(synced_at);
CREATE INDEX IF NOT EXISTS idx_product_attributes_synced_at ON product_attributes(synced_at);
CREATE INDEX IF NOT EXISTS idx_product_images_synced_at ON product_images(synced_at);
CREATE INDEX IF NOT EXISTS idx_store_categories_synced_at ON store_categories(synced_at);
CREATE INDEX IF NOT EXISTS idx_store_tags_synced_at ON store_tags(synced_at);
CREATE INDEX IF NOT EXISTS idx_store_attributes_synced_at ON store_attributes(synced_at);
CREATE INDEX IF NOT EXISTS idx_store_attribute_terms_synced_at ON store_attribute_terms(synced_at);

-- Create indexes for source field (useful for filtering by origin)
CREATE INDEX IF NOT EXISTS idx_products_source ON products(source);
CREATE INDEX IF NOT EXISTS idx_product_variations_source ON product_variations(source);

-- Comments
COMMENT ON COLUMN products.source IS 'Origin of the data: woo (synced from WooCommerce) or local (created in Supabase)';
COMMENT ON COLUMN products.synced_at IS 'Last successful sync timestamp - used to prevent infinite loops and detect conflicts';

COMMENT ON COLUMN product_variations.source IS 'Origin of the data: woo or local';
COMMENT ON COLUMN product_variations.synced_at IS 'Last successful sync timestamp';

COMMENT ON COLUMN product_attributes.source IS 'Origin of the data: woo or local';
COMMENT ON COLUMN product_attributes.synced_at IS 'Last successful sync timestamp';

COMMENT ON COLUMN product_images.source IS 'Origin of the data: woo or local';
COMMENT ON COLUMN product_images.synced_at IS 'Last successful sync timestamp';

COMMENT ON COLUMN store_categories.source IS 'Origin of the data: woo or local';
COMMENT ON COLUMN store_categories.synced_at IS 'Last successful sync timestamp';

COMMENT ON COLUMN store_tags.source IS 'Origin of the data: woo or local';
COMMENT ON COLUMN store_tags.synced_at IS 'Last successful sync timestamp';

COMMENT ON COLUMN store_attributes.source IS 'Origin of the data: woo or local';
COMMENT ON COLUMN store_attributes.synced_at IS 'Last successful sync timestamp';

COMMENT ON COLUMN store_attribute_terms.source IS 'Origin of the data: woo or local';
COMMENT ON COLUMN store_attribute_terms.synced_at IS 'Last successful sync timestamp';
