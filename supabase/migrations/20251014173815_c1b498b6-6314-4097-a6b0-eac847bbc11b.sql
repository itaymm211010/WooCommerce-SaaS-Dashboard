-- Remove the policy that creates recursion
DROP POLICY IF EXISTS "Users can view stores they are members of" ON stores;

-- Keep only the direct policy that doesn't create recursion
-- "Users can view their stores" - this one checks auth.uid() = user_id directly