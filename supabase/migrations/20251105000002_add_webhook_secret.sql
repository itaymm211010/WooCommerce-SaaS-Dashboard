-- Add webhook_secret to stores table for webhook signature verification
-- This is used to verify HMAC signatures from WooCommerce webhooks

ALTER TABLE stores
ADD COLUMN IF NOT EXISTS webhook_secret text;

-- Create webhook_logs table for auditing
CREATE TABLE IF NOT EXISTS webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  topic text NOT NULL,
  status text NOT NULL CHECK (status IN ('success', 'failed')),
  error_message text,
  received_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_webhook_logs_store_id ON webhook_logs(store_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_received_at ON webhook_logs(received_at);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);

-- Enable RLS
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for webhook_logs
CREATE POLICY "webhook_logs_select"
ON webhook_logs FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR user_has_store_access(auth.uid(), store_id)
);

CREATE POLICY "webhook_logs_insert"
ON webhook_logs FOR INSERT
TO service_role
WITH CHECK (true);

-- Comments
COMMENT ON COLUMN stores.webhook_secret IS 'Secret key for verifying WooCommerce webhook HMAC signatures';
COMMENT ON TABLE webhook_logs IS 'Audit log for all webhook activity';
COMMENT ON COLUMN webhook_logs.topic IS 'Webhook topic (e.g., product.updated, order.created)';
COMMENT ON COLUMN webhook_logs.status IS 'Whether the webhook was processed successfully';
COMMENT ON COLUMN webhook_logs.received_at IS 'When the webhook was received';
