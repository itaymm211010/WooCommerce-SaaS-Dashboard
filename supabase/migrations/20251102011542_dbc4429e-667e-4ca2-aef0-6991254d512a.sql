-- First, disable RLS temporarily to clean everything
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies completely
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'stores') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON stores', r.policyname);
    END LOOP;
    
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'products') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON products', r.policyname);
    END LOOP;
    
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'orders') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON orders', r.policyname);
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create NEW policies using ONLY has_role function for admin checks
-- STORES policies
CREATE POLICY "stores_admin_select"
ON stores FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "stores_owner_select"
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

CREATE POLICY "stores_owner_insert"
ON stores FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "stores_owner_update"
ON stores FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "stores_owner_delete"
ON stores FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- PRODUCTS policies
CREATE POLICY "products_admin_select"
ON products FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "products_owner_all"
ON products FOR ALL
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
        AND store_users.role IN ('owner', 'manager')
      )
    )
  )
);

-- ORDERS policies
CREATE POLICY "orders_admin_select"
ON orders FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "orders_owner_all"
ON orders FOR ALL
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
        AND store_users.role IN ('owner', 'manager')
      )
    )
  )
);