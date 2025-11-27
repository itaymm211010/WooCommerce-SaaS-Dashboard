-- ============================================
-- Fix Admin Access Issue
-- ============================================
-- This script assigns admin role to the first registered user
-- Run this in Supabase SQL Editor at:
-- https://supabase.com/dashboard/project/ddwlhgpugjyruzejggoz/sql
-- ============================================

-- Create a function to safely add admin role to the first registered user
CREATE OR REPLACE FUNCTION add_first_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  first_user_id UUID;
BEGIN
  -- Check if there are any admin users
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE role = 'admin') THEN
    -- Get the first user (oldest by created_at)
    SELECT id INTO first_user_id
    FROM auth.users
    ORDER BY created_at ASC
    LIMIT 1;

    -- If we found a user, make them admin
    IF first_user_id IS NOT NULL THEN
      -- Delete existing roles for this user to avoid conflicts
      DELETE FROM user_roles WHERE user_id = first_user_id;

      -- Insert admin role
      INSERT INTO user_roles (user_id, role)
      VALUES (first_user_id, 'admin')
      ON CONFLICT (user_id, role) DO NOTHING;

      RAISE NOTICE 'Admin role assigned to user: %', first_user_id;
    ELSE
      RAISE NOTICE 'No users found in the system';
    END IF;
  ELSE
    RAISE NOTICE 'Admin user already exists';
  END IF;
END;
$$;

-- Execute the function
SELECT add_first_admin();

-- Check the result
SELECT
  u.email,
  ur.role,
  u.created_at
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
ORDER BY u.created_at ASC;
