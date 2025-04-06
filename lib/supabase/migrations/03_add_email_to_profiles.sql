-- Add email field to profiles table
ALTER TABLE IF EXISTS profiles
ADD COLUMN IF NOT EXISTS email TEXT;

-- Comment explaining what this field is for
COMMENT ON COLUMN profiles.email IS 'User email from authentication provider';
