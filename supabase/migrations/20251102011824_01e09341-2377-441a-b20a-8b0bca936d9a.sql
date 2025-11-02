-- Drop ALL existing policies from all tables
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Create security definer function to check store access
CREATE OR REPLACE FUNCTION public.user_has_store_access(_user_id uuid, _store_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM stores 
    WHERE id = _store_id 
    AND user_id = _user_id
  )
  OR EXISTS (
    SELECT 1 FROM store_users
    WHERE store_id = _store_id
    AND user_id = _user_id
  )
$$;

-- STORES policies - simple and clean
CREATE POLICY "stores_select"
ON stores FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR auth.uid() = user_id
  OR user_has_store_access(auth.uid(), id)
);

CREATE POLICY "stores_insert"
ON stores FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "stores_update"
ON stores FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR auth.uid() = user_id
);

CREATE POLICY "stores_delete"
ON stores FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- STORE_USERS policies - no recursion
CREATE POLICY "store_users_select"
ON store_users FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM stores WHERE stores.id = store_users.store_id AND stores.user_id = auth.uid())
);

CREATE POLICY "store_users_manage"
ON store_users FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = store_users.store_id AND stores.user_id = auth.uid())
);

-- PRODUCTS policies
CREATE POLICY "products_select"
ON products FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR user_has_store_access(auth.uid(), store_id)
);

CREATE POLICY "products_manage"
ON products FOR ALL
TO authenticated
USING (
  user_has_store_access(auth.uid(), store_id)
);

-- ORDERS policies
CREATE POLICY "orders_select"
ON orders FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR user_has_store_access(auth.uid(), store_id)
);

CREATE POLICY "orders_manage"
ON orders FOR ALL
TO authenticated
USING (
  user_has_store_access(auth.uid(), store_id)
);