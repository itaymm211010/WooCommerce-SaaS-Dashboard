-- Fix products policies - add admin to manage policy
DROP POLICY IF EXISTS "products_manage" ON products;

CREATE POLICY "products_manage"
ON products FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR user_has_store_access(auth.uid(), store_id)
);

-- Fix orders policies - add admin to manage policy
DROP POLICY IF EXISTS "orders_manage" ON orders;

CREATE POLICY "orders_manage"
ON orders FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR user_has_store_access(auth.uid(), store_id)
);

-- Fix store_users policies - add admin to manage policy
DROP POLICY IF EXISTS "store_users_manage" ON store_users;

CREATE POLICY "store_users_manage"
ON store_users FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM stores WHERE stores.id = store_users.store_id AND stores.user_id = auth.uid())
);