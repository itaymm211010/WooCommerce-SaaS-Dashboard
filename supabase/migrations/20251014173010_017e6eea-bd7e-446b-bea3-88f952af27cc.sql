-- Fix infinite recursion in RLS policies by simplifying them

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their stores" ON stores;
DROP POLICY IF EXISTS "Users can view store memberships" ON store_users;

-- Recreate stores SELECT policy without recursion
CREATE POLICY "Users can view their stores" 
ON stores 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create a separate policy for viewing stores through store_users
CREATE POLICY "Users can view stores they are members of" 
ON stores 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM store_users
    WHERE store_users.store_id = stores.id 
    AND store_users.user_id = auth.uid()
  )
);

-- Recreate store_users SELECT policy - simple, no recursion
CREATE POLICY "Users can view their own store memberships" 
ON store_users 
FOR SELECT 
USING (user_id = auth.uid());

-- Store owners can view all memberships of their stores
CREATE POLICY "Store owners can view all store memberships" 
ON store_users 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM stores
    WHERE stores.id = store_users.store_id 
    AND stores.user_id = auth.uid()
  )
);