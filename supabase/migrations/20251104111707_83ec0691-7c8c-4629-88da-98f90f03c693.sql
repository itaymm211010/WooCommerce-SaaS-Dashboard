-- Create store_attribute_terms table for attribute values/terms
CREATE TABLE IF NOT EXISTS store_attribute_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  attribute_id uuid NOT NULL REFERENCES store_attributes(id) ON DELETE CASCADE,
  woo_id integer NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  count integer DEFAULT 0,
  menu_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(store_id, attribute_id, woo_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_store_attribute_terms_store_id ON store_attribute_terms(store_id);
CREATE INDEX IF NOT EXISTS idx_store_attribute_terms_attribute_id ON store_attribute_terms(attribute_id);
CREATE INDEX IF NOT EXISTS idx_store_attribute_terms_woo_id ON store_attribute_terms(woo_id);

-- Enable RLS
ALTER TABLE store_attribute_terms ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "store_attribute_terms_select"
ON store_attribute_terms FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR user_has_store_access(auth.uid(), store_id)
);

CREATE POLICY "store_attribute_terms_insert"
ON store_attribute_terms FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin')
  OR user_has_store_access(auth.uid(), store_id)
);

CREATE POLICY "store_attribute_terms_update"
ON store_attribute_terms FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR user_has_store_access(auth.uid(), store_id)
)
WITH CHECK (
  has_role(auth.uid(), 'admin')
  OR user_has_store_access(auth.uid(), store_id)
);

CREATE POLICY "store_attribute_terms_delete"
ON store_attribute_terms FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR user_has_store_access(auth.uid(), store_id)
);

-- Comments
COMMENT ON TABLE store_attribute_terms IS 'Terms/values for global WooCommerce product attributes (e.g., Red, Blue for Color attribute)';
COMMENT ON COLUMN store_attribute_terms.attribute_id IS 'Links to the parent global attribute';
COMMENT ON COLUMN store_attribute_terms.count IS 'Number of products using this term';