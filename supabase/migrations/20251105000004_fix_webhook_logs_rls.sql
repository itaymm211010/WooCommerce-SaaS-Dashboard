-- Fix weak RLS policy for webhook_logs
-- Only service_role (Edge Functions) should be able to insert webhook logs

-- Drop the weak INSERT policy
DROP POLICY IF EXISTS "webhook_logs_insert" ON webhook_logs;

-- Create strict INSERT policy - only service_role can insert
CREATE POLICY "webhook_logs_insert_service_role"
ON webhook_logs FOR INSERT
TO service_role
WITH CHECK (true);

-- Ensure authenticated users can only SELECT their own store's logs
DROP POLICY IF EXISTS "webhook_logs_select" ON webhook_logs;

CREATE POLICY "webhook_logs_select_own_stores"
ON webhook_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = webhook_logs.store_id
    AND (
      stores.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM store_users
        WHERE store_users.store_id = stores.id
        AND store_users.user_id = auth.uid()
      )
    )
  )
);

-- Add function to validate webhook logs (additional security layer)
CREATE OR REPLACE FUNCTION validate_webhook_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure topic is not empty
  IF NEW.topic IS NULL OR NEW.topic = '' THEN
    RAISE EXCEPTION 'Webhook topic cannot be empty';
  END IF;

  -- Ensure status is valid
  IF NEW.status NOT IN ('success', 'failed') THEN
    RAISE EXCEPTION 'Invalid webhook status';
  END IF;

  -- Ensure store exists
  IF NOT EXISTS (SELECT 1 FROM stores WHERE id = NEW.store_id) THEN
    RAISE EXCEPTION 'Store does not exist';
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to validate webhook logs before insert
DROP TRIGGER IF EXISTS validate_webhook_log_trigger ON webhook_logs;
CREATE TRIGGER validate_webhook_log_trigger
  BEFORE INSERT ON webhook_logs
  FOR EACH ROW
  EXECUTE FUNCTION validate_webhook_log();

-- Add rate limiting table for webhook logs
CREATE TABLE IF NOT EXISTS webhook_log_rate_limit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  hour_bucket timestamp with time zone NOT NULL,
  log_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(store_id, hour_bucket)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_webhook_log_rate_limit_store_hour ON webhook_log_rate_limit(store_id, hour_bucket);

-- Function to check rate limit (prevent DoS via webhook log flooding)
CREATE OR REPLACE FUNCTION check_webhook_log_rate_limit(store_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_hour timestamp with time zone;
  current_count integer;
  max_logs_per_hour integer := 1000; -- Maximum 1000 webhook logs per hour per store
BEGIN
  current_hour := date_trunc('hour', now());

  -- Get or create rate limit record
  INSERT INTO webhook_log_rate_limit (store_id, hour_bucket, log_count)
  VALUES (store_uuid, current_hour, 1)
  ON CONFLICT (store_id, hour_bucket)
  DO UPDATE SET log_count = webhook_log_rate_limit.log_count + 1
  RETURNING log_count INTO current_count;

  -- Check if rate limit exceeded
  IF current_count > max_logs_per_hour THEN
    RAISE WARNING 'Rate limit exceeded for store %: % logs in current hour', store_uuid, current_count;
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

-- Comments
COMMENT ON POLICY "webhook_logs_insert_service_role" ON webhook_logs IS 'Only service_role (Edge Functions) can insert webhook logs to prevent forgery';
COMMENT ON FUNCTION validate_webhook_log IS 'Validates webhook log data before insertion';
COMMENT ON FUNCTION check_webhook_log_rate_limit IS 'Prevents DoS attacks via webhook log flooding';
