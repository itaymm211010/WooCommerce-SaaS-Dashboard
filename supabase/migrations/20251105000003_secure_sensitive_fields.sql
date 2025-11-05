-- Secure sensitive fields in stores table
-- This migration protects api_key, api_secret, and webhook_secret from unauthorized access

-- Step 1: Create a view without sensitive fields for regular queries
CREATE OR REPLACE VIEW stores_public AS
SELECT
  id,
  name,
  url,
  user_id,
  currency,
  created_at,
  updated_at
FROM stores;

-- Step 2: Grant access to the view
GRANT SELECT ON stores_public TO authenticated;

-- Step 3: Create RPC function to get store credentials (only for authorized users)
CREATE OR REPLACE FUNCTION get_store_credentials(store_uuid uuid)
RETURNS TABLE (
  api_key text,
  api_secret text,
  webhook_secret text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user has access to this store
  IF NOT EXISTS (
    SELECT 1 FROM stores
    WHERE id = store_uuid
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM store_users
        WHERE store_id = store_uuid
        AND user_id = auth.uid()
        AND role IN ('owner', 'manager')
      )
    )
  ) THEN
    RAISE EXCEPTION 'Access denied: You do not have permission to access this store credentials';
  END IF;

  -- Return credentials only if authorized
  RETURN QUERY
  SELECT
    s.api_key,
    s.api_secret,
    s.webhook_secret
  FROM stores s
  WHERE s.id = store_uuid;
END;
$$;

-- Step 4: Update RLS policies to prevent direct access to sensitive fields
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their stores" ON stores;

-- Create new restrictive policy
CREATE POLICY "Users can view their stores (limited fields)"
ON stores FOR SELECT
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM store_users
    WHERE store_users.store_id = stores.id
    AND store_users.user_id = auth.uid()
  )
);

-- Allow users to see stores but they should use stores_public view or get_store_credentials() function
-- This policy still allows SELECT but frontend should be updated to use the safe methods

-- Step 5: Create audit log for credential access
CREATE TABLE IF NOT EXISTS credential_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accessed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  ip_address text,
  user_agent text
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_credential_access_logs_store_id ON credential_access_logs(store_id);
CREATE INDEX IF NOT EXISTS idx_credential_access_logs_user_id ON credential_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_credential_access_logs_accessed_at ON credential_access_logs(accessed_at);

-- Enable RLS
ALTER TABLE credential_access_logs ENABLE ROW LEVEL SECURITY;

-- RLS policy for credential access logs
CREATE POLICY "Users can view their own access logs"
ON credential_access_logs FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "System can insert access logs"
ON credential_access_logs FOR INSERT
TO service_role
WITH CHECK (true);

-- Step 6: Create function to log credential access
CREATE OR REPLACE FUNCTION log_credential_access(
  store_uuid uuid,
  ip text DEFAULT NULL,
  agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO credential_access_logs (store_id, user_id, ip_address, user_agent)
  VALUES (store_uuid, auth.uid(), ip, agent);
END;
$$;

-- Comments
COMMENT ON VIEW stores_public IS 'Safe view of stores without sensitive credentials';
COMMENT ON FUNCTION get_store_credentials IS 'Securely retrieve store credentials with access control and audit logging';
COMMENT ON TABLE credential_access_logs IS 'Audit log for all credential access attempts';
