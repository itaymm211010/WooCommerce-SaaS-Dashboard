-- Diagnostic script for Self-Hosted Supabase Auth Issues
-- Run this with: docker exec -i supabase-db-csg4gww8cwggks8k84osgcsg psql -U postgres -d postgres -f /tmp/diagnose-auth.sql

\echo '=== 1. Check PostgreSQL Extensions ==='
SELECT extname, extversion FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto', 'pgjwt');

\echo ''
\echo '=== 2. Check Auth Schema Exists ==='
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'auth';

\echo ''
\echo '=== 3. Check Auth Tables ==='
SELECT tablename FROM pg_tables WHERE schemaname = 'auth' ORDER BY tablename;

\echo ''
\echo '=== 4. Check Users Table ==='
SELECT COUNT(*) as user_count FROM auth.users;
SELECT id, email, created_at, confirmed_at, email_confirmed_at FROM auth.users LIMIT 5;

\echo ''
\echo '=== 5. Check Auth Identities ==='
SELECT COUNT(*) as identity_count FROM auth.identities;

\echo ''
\echo '=== 6. Check User Roles Table ==='
SELECT COUNT(*) as role_count FROM public.user_roles;
SELECT ur.user_id, ur.role, u.email
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
LIMIT 10;

\echo ''
\echo '=== 7. Check has_role Function ==='
SELECT proname, pronamespace::regnamespace as schema
FROM pg_proc
WHERE proname = 'has_role';

\echo ''
\echo '=== 8. Test has_role Function ==='
-- This should return the roles for existing users
SELECT u.id, u.email, has_role(u.id, 'admin'::app_role) as is_admin
FROM auth.users u
LIMIT 5;

\echo ''
\echo '=== 9. Check RLS on task_logs ==='
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relname = 'task_logs';

\echo ''
\echo '=== 10. Check task_logs Policies ==='
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'task_logs';

\echo ''
\echo '=== 11. Check Auth Config (from auth.config) ==='
-- This might not exist in all Supabase versions
SELECT * FROM auth.config LIMIT 5;

\echo ''
\echo '=== 12. Check Realtime Schema ==='
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'realtime';

\echo ''
\echo 'Diagnostics Complete!'
