-- Drop the problematic policy that creates recursion
DROP POLICY IF EXISTS "Store owners can view all store memberships" ON store_users;

-- The "Users can view their own store memberships" policy is enough for members to see their own rows
-- The "Store owners can manage users" ALL policy already covers owners viewing their store's memberships