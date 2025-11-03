-- Create store_attributes table for global WooCommerce attributes
CREATE TABLE IF NOT EXISTS store_attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  woo_id integer NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  type text DEFAULT 'select',
  order_by text DEFAULT 'menu_order',
  has_archives boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(store_id, woo_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_store_attributes_store_id ON store_attributes(store_id);
CREATE INDEX IF NOT EXISTS idx_store_attributes_woo_id ON store_attributes(woo_id);

-- Enable RLS
ALTER TABLE store_attributes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "store_attributes_select"
ON store_attributes FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR user_has_store_access(auth.uid(), store_id)
);

CREATE POLICY "store_attributes_insert"
ON store_attributes FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR user_has_store_access(auth.uid(), store_id)
);

CREATE POLICY "store_attributes_update"
ON store_attributes FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR user_has_store_access(auth.uid(), store_id)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR user_has_store_access(auth.uid(), store_id)
);

CREATE POLICY "store_attributes_delete"
ON store_attributes FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR user_has_store_access(auth.uid(), store_id)
);

-- Add global_attribute_id to product_attributes
ALTER TABLE product_attributes
ADD COLUMN IF NOT EXISTS global_attribute_id uuid REFERENCES store_attributes(id) ON DELETE SET NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_product_attributes_global_id ON product_attributes(global_attribute_id);

-- Comments
COMMENT ON TABLE store_attributes IS 'Global WooCommerce product attributes that can be reused across products';
COMMENT ON COLUMN product_attributes.global_attribute_id IS 'Links to a global attribute if this is not a custom product-specific attribute';