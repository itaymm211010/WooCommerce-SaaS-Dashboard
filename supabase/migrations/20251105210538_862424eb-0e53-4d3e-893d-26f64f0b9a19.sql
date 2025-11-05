-- Secure sensitive fields in stores table
-- This migration ensures that only store owners can access sensitive credentials

-- Drop existing RLS policies for stores
DROP POLICY IF EXISTS "stores_select" ON stores;

-- Create new granular SELECT policies
-- Policy 1: Store owners and admins can see all fields including sensitive ones
CREATE POLICY "stores_select_owner"
ON stores FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR auth.uid() = user_id
);

-- Policy 2: Store users (not owners) can see only non-sensitive fields
-- This is handled by creating a view that excludes sensitive fields
CREATE OR REPLACE VIEW store_basic_info AS
SELECT 
  id,
  user_id,
  name,
  url,
  currency,
  created_at,
  updated_at
FROM stores;

-- Grant access to the view
GRANT SELECT ON store_basic_info TO authenticated;

-- Create RLS policy for the view
ALTER VIEW store_basic_info SET (security_invoker = true);

-- Add comment explaining the security model
COMMENT ON POLICY "stores_select_owner" ON stores IS 
  'Only store owners and admins can access sensitive fields (api_key, api_secret, webhook_secret). Other users should use store_basic_info view.';

COMMENT ON VIEW store_basic_info IS 
  'Non-sensitive store information accessible to all users with store access. Does not include API credentials.';