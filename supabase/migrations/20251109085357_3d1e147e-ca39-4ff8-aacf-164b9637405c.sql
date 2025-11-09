-- ============================================================================
-- Fix Security Definer Views - Remove SECURITY DEFINER Property
-- ============================================================================
-- Issue: Views with SECURITY DEFINER can bypass RLS policies
-- Solution: Recreate views without SECURITY DEFINER
-- ============================================================================

-- Drop existing views
DROP VIEW IF EXISTS audit_critical_changes;
DROP VIEW IF EXISTS audit_user_activity;

-- Recreate views WITHOUT SECURITY DEFINER
-- Recent critical changes
CREATE VIEW audit_critical_changes AS
SELECT 
  al.*,
  CASE 
    WHEN table_name = 'stores' THEN 'CRITICAL'
    WHEN table_name = 'user_roles' THEN 'CRITICAL'
    WHEN table_name IN ('orders', 'store_users', 'webhooks') THEN 'HIGH'
    ELSE 'MEDIUM'
  END as severity
FROM audit_logs al
WHERE table_name IN ('stores', 'user_roles', 'orders', 'store_users', 'bug_reports', 'webhooks')
ORDER BY created_at DESC;

COMMENT ON VIEW audit_critical_changes IS 'Security: Shows recent changes to the most sensitive tables';

-- User activity summary
CREATE VIEW audit_user_activity AS
SELECT 
  user_email,
  user_id,
  table_name,
  action,
  COUNT(*) as change_count,
  MAX(created_at) as last_change,
  MIN(created_at) as first_change
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY user_email, user_id, table_name, action
ORDER BY change_count DESC;

COMMENT ON VIEW audit_user_activity IS 'Security: Summarizes user activity for the last 30 days';