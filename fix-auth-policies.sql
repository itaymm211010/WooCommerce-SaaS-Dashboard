-- Quick Fix for Auth and RLS Issues
-- Run this if diagnostic script reveals missing policies or functions

\echo '=== Checking has_role function ==='
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_role') THEN
        RAISE NOTICE 'has_role function is missing! Creating it...';

        CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role app_role)
        RETURNS BOOLEAN
        LANGUAGE SQL
        STABLE
        SECURITY DEFINER
        SET search_path = public
        AS $func$
          SELECT EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = _user_id AND role = _role
          )
        $func$;

        RAISE NOTICE 'has_role function created successfully';
    ELSE
        RAISE NOTICE 'has_role function exists';
    END IF;
END
$$;

\echo '=== Checking task_logs INSERT policy ==='
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'task_logs'
        AND policyname = 'Authenticated users can insert logs'
    ) THEN
        RAISE NOTICE 'task_logs INSERT policy is missing! Creating it...';

        CREATE POLICY "Authenticated users can insert logs"
        ON public.task_logs FOR INSERT
        TO authenticated
        WITH CHECK (true);

        RAISE NOTICE 'task_logs INSERT policy created successfully';
    ELSE
        RAISE NOTICE 'task_logs INSERT policy exists';
    END IF;
END
$$;

\echo '=== Granting necessary permissions ==='
-- Ensure authenticated role can access tables
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT ON public.task_logs TO authenticated;
GRANT SELECT ON public.tasks TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT ON auth.users TO authenticated;

\echo '=== Checking required extensions ==='
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\echo '=== Verifying auth schema permissions ==='
-- Ensure GoTrue can access auth schema
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres;

\echo '=== Fix complete! ==='
\echo 'If auth still fails, check GoTrue logs with:'
\echo '  docker logs supabase-auth-csg4gww8cwggks8k84osgcsg --tail 100'
