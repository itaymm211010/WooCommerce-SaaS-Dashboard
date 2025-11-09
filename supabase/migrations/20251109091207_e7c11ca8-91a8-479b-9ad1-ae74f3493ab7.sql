-- Create table for tracking automated response actions
CREATE TABLE IF NOT EXISTS public.anomaly_response_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anomaly_id TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('email_sent', 'user_suspended', 'log_created', 'notification_sent')),
  target_user_id UUID REFERENCES auth.users(id),
  target_email TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('high', 'medium', 'low')),
  metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.anomaly_response_actions ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view all actions
CREATE POLICY "Admins can view all response actions"
ON public.anomaly_response_actions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Create policy for service role to insert/update actions
CREATE POLICY "Service role can manage response actions"
ON public.anomaly_response_actions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_anomaly_response_actions_created_at ON public.anomaly_response_actions(created_at DESC);
CREATE INDEX idx_anomaly_response_actions_anomaly_id ON public.anomaly_response_actions(anomaly_id);
CREATE INDEX idx_anomaly_response_actions_status ON public.anomaly_response_actions(status);

-- Add table to audit logging
CREATE TRIGGER audit_anomaly_response_actions
  AFTER INSERT OR UPDATE OR DELETE ON public.anomaly_response_actions
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();