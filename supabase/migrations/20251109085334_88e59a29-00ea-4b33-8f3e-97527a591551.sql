-- ============================================================================
-- Audit Log System - Track All Sensitive Changes
-- ============================================================================
-- Purpose: Track all changes to critical tables for security and compliance
-- Features: Automatic logging of INSERT/UPDATE/DELETE with user, timestamp, and old/new values
-- ============================================================================

-- ============================================================================
-- 1. Create audit_logs table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data jsonb,
  new_data jsonb,
  changed_fields text[],
  user_id uuid REFERENCES auth.users(id),
  user_email text,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add indexes for better query performance
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role can insert (for triggers)
CREATE POLICY "Service role can insert audit logs"
ON audit_logs
FOR INSERT
WITH CHECK (true);

COMMENT ON TABLE audit_logs IS 'Security: Tracks all changes to sensitive tables for compliance and security auditing';

-- ============================================================================
-- 2. Create audit logging function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.audit_log_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_data jsonb;
  new_data jsonb;
  changed_fields text[];
  user_email_val text;
BEGIN
  -- Get user email
  SELECT email INTO user_email_val 
  FROM auth.users 
  WHERE id = auth.uid();

  -- Prepare data based on operation
  IF (TG_OP = 'DELETE') THEN
    old_data := row_to_json(OLD)::jsonb;
    new_data := NULL;
    changed_fields := NULL;
  ELSIF (TG_OP = 'INSERT') THEN
    old_data := NULL;
    new_data := row_to_json(NEW)::jsonb;
    changed_fields := NULL;
  ELSIF (TG_OP = 'UPDATE') THEN
    old_data := row_to_json(OLD)::jsonb;
    new_data := row_to_json(NEW)::jsonb;
    
    -- Identify changed fields
    SELECT array_agg(key)
    INTO changed_fields
    FROM jsonb_each(old_data)
    WHERE old_data->key IS DISTINCT FROM new_data->key;
  END IF;

  -- Insert audit log
  INSERT INTO audit_logs (
    table_name,
    record_id,
    action,
    old_data,
    new_data,
    changed_fields,
    user_id,
    user_email
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    old_data,
    new_data,
    changed_fields,
    auth.uid(),
    user_email_val
  );

  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

COMMENT ON FUNCTION audit_log_changes IS 'Security: Automatically logs all changes to audited tables';

-- ============================================================================
-- 3. Add audit triggers to sensitive tables
-- ============================================================================

-- STORES (API keys, credentials) - CRITICAL
DROP TRIGGER IF EXISTS audit_stores_changes ON stores;
CREATE TRIGGER audit_stores_changes
  AFTER INSERT OR UPDATE OR DELETE ON stores
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- ORDERS (customer data) - HIGH
DROP TRIGGER IF EXISTS audit_orders_changes ON orders;
CREATE TRIGGER audit_orders_changes
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- PRODUCTS (inventory, prices) - MEDIUM
DROP TRIGGER IF EXISTS audit_products_changes ON products;
CREATE TRIGGER audit_products_changes
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- USER_ROLES (permissions) - CRITICAL
DROP TRIGGER IF EXISTS audit_user_roles_changes ON user_roles;
CREATE TRIGGER audit_user_roles_changes
  AFTER INSERT OR UPDATE OR DELETE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- STORE_USERS (access control) - HIGH
DROP TRIGGER IF EXISTS audit_store_users_changes ON store_users;
CREATE TRIGGER audit_store_users_changes
  AFTER INSERT OR UPDATE OR DELETE ON store_users
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- BUG_REPORTS (security issues) - HIGH
DROP TRIGGER IF EXISTS audit_bug_reports_changes ON bug_reports;
CREATE TRIGGER audit_bug_reports_changes
  AFTER INSERT OR UPDATE OR DELETE ON bug_reports
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- DEPLOYMENTS (infrastructure changes) - MEDIUM
DROP TRIGGER IF EXISTS audit_deployments_changes ON deployments;
CREATE TRIGGER audit_deployments_changes
  AFTER INSERT OR UPDATE OR DELETE ON deployments
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- PROFILES (user data) - MEDIUM
DROP TRIGGER IF EXISTS audit_profiles_changes ON profiles;
CREATE TRIGGER audit_profiles_changes
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- WEBHOOKS (integration security) - HIGH
DROP TRIGGER IF EXISTS audit_webhooks_changes ON webhooks;
CREATE TRIGGER audit_webhooks_changes
  AFTER INSERT OR UPDATE OR DELETE ON webhooks
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- STORE_CATEGORIES (taxonomy changes) - LOW
DROP TRIGGER IF EXISTS audit_store_categories_changes ON store_categories;
CREATE TRIGGER audit_store_categories_changes
  AFTER INSERT OR UPDATE OR DELETE ON store_categories
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- STORE_BRANDS (taxonomy changes) - LOW
DROP TRIGGER IF EXISTS audit_store_brands_changes ON store_brands;
CREATE TRIGGER audit_store_brands_changes
  AFTER INSERT OR UPDATE OR DELETE ON store_brands
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- STORE_TAGS (taxonomy changes) - LOW
DROP TRIGGER IF EXISTS audit_store_tags_changes ON store_tags;
CREATE TRIGGER audit_store_tags_changes
  AFTER INSERT OR UPDATE OR DELETE ON store_tags
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- ============================================================================
-- 4. Create helper views for common audit queries
-- ============================================================================

-- Recent critical changes
CREATE OR REPLACE VIEW audit_critical_changes AS
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
CREATE OR REPLACE VIEW audit_user_activity AS
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

-- ============================================================================
-- 5. Create cleanup function for old audit logs
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Keep audit logs for 1 year, then archive or delete
  DELETE FROM audit_logs 
  WHERE created_at < NOW() - INTERVAL '365 days';
END;
$$;

COMMENT ON FUNCTION cleanup_old_audit_logs IS 'Security: Cleans up audit logs older than 1 year (run monthly via cron)';

-- ============================================================================
-- Summary
-- ============================================================================
COMMENT ON TABLE audit_logs IS 
  'Audit Log System - Tracks all changes to sensitive tables. Monitored tables: stores (CRITICAL), user_roles (CRITICAL), orders (HIGH), store_users (HIGH), bug_reports (HIGH), webhooks (HIGH), products (MEDIUM), deployments (MEDIUM), profiles (MEDIUM), taxonomies (LOW)';

-- Grant service role full access for triggers
GRANT ALL ON audit_logs TO service_role;