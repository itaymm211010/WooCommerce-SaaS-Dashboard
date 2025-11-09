-- ============================================================================
-- Fix Function Search Path - Security Enhancement
-- ============================================================================
-- Issue: Functions don't have explicit search_path set
-- Solution: Add SET search_path = public to all functions
-- ============================================================================

-- Fix has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Fix user_has_store_access function
CREATE OR REPLACE FUNCTION public.user_has_store_access(_user_id uuid, _store_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM stores 
    WHERE id = _store_id 
    AND user_id = _user_id
  )
  OR EXISTS (
    SELECT 1 FROM store_users
    WHERE store_id = _store_id
    AND user_id = _user_id
  )
$$;

-- Fix cleanup_old_sync_logs function
CREATE OR REPLACE FUNCTION public.cleanup_old_sync_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM sync_logs WHERE created_at < NOW() - INTERVAL '30 days';
  DELETE FROM sync_errors WHERE resolved = true AND resolved_at < NOW() - INTERVAL '90 days';
END;
$$;

-- Fix cleanup_old_taxonomy_sync_logs function
CREATE OR REPLACE FUNCTION public.cleanup_old_taxonomy_sync_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM taxonomy_sync_log
  WHERE created_at < now() - interval '30 days';
END;
$$;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix update_agent_insights_updated_at function
CREATE OR REPLACE FUNCTION public.update_agent_insights_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.has_role IS 
  'Security: Checks user role with explicit search_path to prevent SQL injection';

COMMENT ON FUNCTION public.user_has_store_access IS 
  'Security: Verifies store access with explicit search_path to prevent SQL injection';

COMMENT ON FUNCTION public.cleanup_old_sync_logs IS 
  'Security: Cleanup function with explicit search_path';

COMMENT ON FUNCTION public.cleanup_old_taxonomy_sync_logs IS 
  'Security: Cleanup function with explicit search_path';

COMMENT ON FUNCTION public.handle_new_user IS 
  'Security: User creation trigger with explicit search_path';

COMMENT ON FUNCTION public.update_updated_at_column IS 
  'Security: Update timestamp trigger with explicit search_path';

COMMENT ON FUNCTION public.update_agent_insights_updated_at IS 
  'Security: Update timestamp trigger with explicit search_path';