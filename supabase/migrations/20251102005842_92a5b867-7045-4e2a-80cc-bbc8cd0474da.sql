-- Update RLS policies to allow admin access to all data

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can view their stores" ON stores;
DROP POLICY IF EXISTS "Users can view products from accessible stores" ON products;
DROP POLICY IF EXISTS "Users can view orders from accessible stores" ON orders;

-- Stores: Admin can see all, users see their own
CREATE POLICY "Admin and users can view stores"
ON stores FOR SELECT
TO authenticated
USING (
  -- Check if user is admin
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
  -- OR user owns the store
  OR auth.uid() = user_id
  -- OR user has access through store_users
  OR EXISTS (
    SELECT 1 FROM store_users
    WHERE store_users.store_id = stores.id
    AND store_users.user_id = auth.uid()
  )
);

-- Products: Admin can see all, users see from their stores
CREATE POLICY "Admin and users can view products"
ON products FOR SELECT
TO authenticated
USING (
  -- Check if user is admin
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
  -- OR user has access to the store
  OR EXISTS (
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

-- Orders: Admin can see all, users see from their stores
CREATE POLICY "Admin and users can view orders"
ON orders FOR SELECT
TO authenticated
USING (
  -- Check if user is admin
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
  -- OR user has access to the store
  OR EXISTS (
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