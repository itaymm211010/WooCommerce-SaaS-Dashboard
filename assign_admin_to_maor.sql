-- ============================================
-- Assign Admin Role to maor.itay@gmail.com
-- ============================================
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ddwlhgpugjyruzejggoz/sql
-- ============================================

DO $$
DECLARE
  user_id_var UUID;
  user_email TEXT := 'maor.itay@gmail.com';
BEGIN
  -- Get user ID by email
  SELECT id INTO user_id_var
  FROM auth.users
  WHERE email = user_email
  LIMIT 1;

  -- Check if user exists
  IF user_id_var IS NULL THEN
    RAISE EXCEPTION 'User not found with email: %. Please sign up first at the app.', user_email;
  END IF;

  -- Delete any existing roles to avoid conflicts
  DELETE FROM user_roles WHERE user_id = user_id_var;
  RAISE NOTICE 'Deleted existing roles for user: %', user_email;

  -- Insert admin role
  INSERT INTO user_roles (user_id, role)
  VALUES (user_id_var, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RAISE NOTICE '✅ SUCCESS! Admin role assigned to: % (ID: %)', user_email, user_id_var;
  RAISE NOTICE 'You can now log in and access the admin panel at /admin/users';

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '❌ ERROR: %', SQLERRM;
END $$;

-- Verify the role was assigned
SELECT
  u.id,
  u.email,
  ur.role,
  u.created_at as "Registered At"
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE u.email = 'maor.itay@gmail.com';
