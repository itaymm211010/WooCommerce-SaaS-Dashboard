-- Fix webhook_logs RLS policies to allow proper access

-- Drop existing INSERT policy that was too restrictive
DROP POLICY IF EXISTS "webhook_logs_insert" ON webhook_logs;

-- Create new INSERT policy that allows anon and service_role to insert
-- This is needed because webhooks come from external sources (WooCommerce)
CREATE POLICY "webhook_logs_insert"
ON webhook_logs FOR INSERT
TO anon, service_role
WITH CHECK (true);

-- Ensure the SELECT policy works correctly for authenticated users
DROP POLICY IF EXISTS "webhook_logs_select" ON webhook_logs;

CREATE POLICY "webhook_logs_select"
ON webhook_logs FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR user_has_store_access(auth.uid(), store_id)
);

-- Add comment
COMMENT ON POLICY "webhook_logs_insert" ON webhook_logs IS 
  'Allows webhooks from external sources (WooCommerce) to log their activity. No authentication required for INSERT as webhooks come from external services.';

COMMENT ON POLICY "webhook_logs_select" ON webhook_logs IS 
  'Only store owners, store users, and admins can view webhook logs for their stores.';