-- Fix RLS policies for store_attributes to allow authenticated users to insert
-- This is needed because sync happens from frontend with regular user authentication

-- Drop existing policies
DROP POLICY IF EXISTS "store_attributes_select" ON store_attributes;
DROP POLICY IF EXISTS "store_attributes_manage" ON store_attributes;

-- Recreate with better permissions
CREATE POLICY "store_attributes_select"
ON store_attributes FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR user_has_store_access(auth.uid(), store_id)
);

CREATE POLICY "store_attributes_insert"
ON store_attributes FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin')
  OR user_has_store_access(auth.uid(), store_id)
);

CREATE POLICY "store_attributes_update"
ON store_attributes FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR user_has_store_access(auth.uid(), store_id)
)
WITH CHECK (
  has_role(auth.uid(), 'admin')
  OR user_has_store_access(auth.uid(), store_id)
);

CREATE POLICY "store_attributes_delete"
ON store_attributes FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR user_has_store_access(auth.uid(), store_id)
);
