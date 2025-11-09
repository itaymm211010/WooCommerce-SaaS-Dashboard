-- ============================================================================
-- Fix store_basic_info View Security
-- ============================================================================
-- Issue: store_basic_info is a view without security_invoker
-- Solution: Make it a security_invoker view to inherit RLS from stores table
-- ============================================================================

-- Recreate the view with security_invoker enabled
CREATE OR REPLACE VIEW store_basic_info 
WITH (security_invoker = true) AS
SELECT 
  id,
  user_id,
  name,
  url,
  currency,
  created_at,
  updated_at
FROM stores;

-- Grant appropriate permissions
GRANT SELECT ON store_basic_info TO authenticated;

COMMENT ON VIEW store_basic_info IS 
  'Security: View inherits RLS from stores table via security_invoker. Users can only see their own stores.';

-- ============================================================================
-- Verify stores table has proper RLS policies
-- ============================================================================

-- Ensure stores table RLS is enabled (should already be enabled)
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE stores IS 
  'Store credentials and configuration. Protected by RLS - users can only access their own stores or stores they have been granted access to.';