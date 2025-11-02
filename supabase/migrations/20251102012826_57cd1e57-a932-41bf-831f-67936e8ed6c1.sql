-- Add RLS policies for webhooks table
CREATE POLICY "webhooks_select"
ON webhooks FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR user_has_store_access(auth.uid(), store_id)
);

CREATE POLICY "webhooks_manage"
ON webhooks FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM stores WHERE stores.id = webhooks.store_id AND stores.user_id = auth.uid())
);

-- Add RLS policies for other tables that might be missing
CREATE POLICY "product_images_select"
ON product_images FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR user_has_store_access(auth.uid(), store_id)
);

CREATE POLICY "product_images_manage"
ON product_images FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR user_has_store_access(auth.uid(), store_id)
);

CREATE POLICY "product_attributes_select"
ON product_attributes FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR user_has_store_access(auth.uid(), store_id)
);

CREATE POLICY "product_attributes_manage"
ON product_attributes FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR user_has_store_access(auth.uid(), store_id)
);

CREATE POLICY "product_variations_select"
ON product_variations FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR user_has_store_access(auth.uid(), store_id)
);

CREATE POLICY "product_variations_manage"
ON product_variations FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR user_has_store_access(auth.uid(), store_id)
);

CREATE POLICY "order_status_logs_select"
ON order_status_logs FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR user_has_store_access(auth.uid(), store_id)
);

CREATE POLICY "order_status_logs_insert"
ON order_status_logs FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin')
  OR user_has_store_access(auth.uid(), store_id)
);

-- Taxonomies tables
CREATE POLICY "store_categories_select"
ON store_categories FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR user_has_store_access(auth.uid(), store_id)
);

CREATE POLICY "store_categories_manage"
ON store_categories FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR user_has_store_access(auth.uid(), store_id)
);

CREATE POLICY "store_tags_select"
ON store_tags FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR user_has_store_access(auth.uid(), store_id)
);

CREATE POLICY "store_tags_manage"
ON store_tags FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR user_has_store_access(auth.uid(), store_id)
);

CREATE POLICY "store_brands_select"
ON store_brands FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR user_has_store_access(auth.uid(), store_id)
);

CREATE POLICY "store_brands_manage"
ON store_brands FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR user_has_store_access(auth.uid(), store_id)
);

CREATE POLICY "taxonomy_sync_log_select"
ON taxonomy_sync_log FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR user_has_store_access(auth.uid(), store_id)
);