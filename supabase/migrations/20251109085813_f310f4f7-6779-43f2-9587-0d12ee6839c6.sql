-- ============================================================================
-- Enable Realtime for Audit Logs
-- ============================================================================
-- Purpose: Enable real-time notifications for critical changes
-- ============================================================================

-- Enable realtime for audit_logs table
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;

COMMENT ON TABLE audit_logs IS 
  'Audit Log System - Tracks all changes to sensitive tables with REALTIME enabled for critical alerts';