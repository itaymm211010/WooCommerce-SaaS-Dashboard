-- Create sync_logs table to track all sync operations
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('product', 'order', 'category', 'tag', 'brand', 'attribute', 'variation')),
  entity_id TEXT,
  woo_id BIGINT,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'sync')),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')) DEFAULT 'pending',
  duration_ms INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sync_errors table to track sync failures
CREATE TABLE IF NOT EXISTS sync_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  woo_id BIGINT,
  error_message TEXT NOT NULL,
  error_code TEXT,
  stack_trace TEXT,
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMPTZ,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sync_logs_store_id ON sync_logs(store_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_entity_type ON sync_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON sync_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sync_errors_store_id ON sync_errors(store_id);
CREATE INDEX IF NOT EXISTS idx_sync_errors_entity_type ON sync_errors(entity_type);
CREATE INDEX IF NOT EXISTS idx_sync_errors_resolved ON sync_errors(resolved);
CREATE INDEX IF NOT EXISTS idx_sync_errors_created_at ON sync_errors(created_at DESC);

-- Enable RLS
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_errors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sync_logs
CREATE POLICY "sync_logs_select"
  ON sync_logs FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    OR user_has_store_access(auth.uid(), store_id)
  );

CREATE POLICY "sync_logs_insert"
  ON sync_logs FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) 
    OR user_has_store_access(auth.uid(), store_id)
  );

-- Service role full access for edge functions
CREATE POLICY "service_role_sync_logs"
  ON sync_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for sync_errors
CREATE POLICY "sync_errors_select"
  ON sync_errors FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    OR user_has_store_access(auth.uid(), store_id)
  );

CREATE POLICY "sync_errors_update"
  ON sync_errors FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    OR user_has_store_access(auth.uid(), store_id)
  );

-- Service role full access for edge functions
CREATE POLICY "service_role_sync_errors"
  ON sync_errors FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Auto-cleanup function for old sync logs (keep 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_sync_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM sync_logs WHERE created_at < NOW() - INTERVAL '30 days';
  DELETE FROM sync_errors WHERE resolved = true AND resolved_at < NOW() - INTERVAL '90 days';
END;
$$;

-- Comments
COMMENT ON TABLE sync_logs IS 'Tracks all sync operations between WooCommerce and Supabase';
COMMENT ON TABLE sync_errors IS 'Tracks sync failures and errors for monitoring and retry logic';