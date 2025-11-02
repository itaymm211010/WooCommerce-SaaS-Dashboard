-- Drop the problematic policies
DROP POLICY IF EXISTS "Admin and users can view stores" ON stores;
DROP POLICY IF EXISTS "Admin and users can view products" ON products;
DROP POLICY IF EXISTS "Admin and users can view orders" ON orders;

-- Recreate stores policies using has_role function to prevent recursion
CREATE POLICY "Admin users can view all stores"
ON stores FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own stores"
ON stores FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM store_users 
    WHERE store_users.store_id = stores.id 
    AND store_users.user_id = auth.uid()
  )
);

-- Recreate products policies
CREATE POLICY "Admin users can view all products"
ON products FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view products from their stores"
ON products FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = products.store_id 
    AND (
      stores.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM store_users 
        WHERE store_users.store_id = stores.id 
        AND store_users.user_id = auth.uid()
      )
    )
  )
);

-- Recreate orders policies
CREATE POLICY "Admin users can view all orders"
ON orders FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view orders from their stores"
ON orders FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = orders.store_id 
    AND (
      stores.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM store_users 
        WHERE store_users.store_id = stores.id 
        AND store_users.user_id = auth.uid()
      )
    )
  )
);