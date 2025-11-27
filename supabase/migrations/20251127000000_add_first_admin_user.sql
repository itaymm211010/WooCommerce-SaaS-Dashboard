-- Create a function to safely add admin role to the first registered user
-- This solves the "chicken and egg" problem where no one can be admin initially

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
    END IF;
  END IF;
END;
$$;

-- Execute the function
SELECT add_first_admin();

-- Optionally, you can drop the function after use if you want
-- DROP FUNCTION IF EXISTS add_first_admin();
