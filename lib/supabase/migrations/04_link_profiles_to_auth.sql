-- Link profiles table to auth.users with cascade delete
-- This ensures when a user is deleted from auth, their profile is also deleted

-- First, ensure we have permissions to reference the auth schema
GRANT REFERENCES ON TABLE auth.users TO postgres, authenticated, service_role;

-- Delete orphaned profiles that don't have a corresponding auth user
-- This needs to be done before adding the foreign key constraint
DELETE FROM profiles
WHERE id NOT IN (SELECT id FROM auth.users);

-- Add foreign key constraint with cascade delete
ALTER TABLE profiles 
    ADD CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;

-- Add a comment explaining the constraint
COMMENT ON CONSTRAINT profiles_id_fkey ON profiles 
IS 'Automatically delete profile when user is deleted from auth system';
