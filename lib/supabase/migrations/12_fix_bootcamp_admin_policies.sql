-- Fix infinite recursion in bootcamp_admins policy
-- This migration corrects the policies for bootcamp_admins table

-- First, drop ALL policies on the bootcamp_admins table
DROP POLICY IF EXISTS "Anyone can view bootcamp admins" ON bootcamp_admins;
DROP POLICY IF EXISTS "Admins can manage bootcamp admins" ON bootcamp_admins;
DROP POLICY IF EXISTS "Initial bootstrap admin or current admins can manage bootcamp admins" ON bootcamp_admins;

-- Simplify approach: remove RLS temporarily, insert first admin, then re-enable RLS
-- First, disable RLS on the table
ALTER TABLE bootcamp_admins DISABLE ROW LEVEL SECURITY;

-- Insert the first admin (uncomment and replace with your username)
-- INSERT INTO bootcamp_admins (discord_username) VALUES ('your_discord_username');

-- Create a special bootstrapping table to track superadmins
CREATE TABLE IF NOT EXISTS "bootcamp_superadmins" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Re-enable RLS
ALTER TABLE bootcamp_admins ENABLE ROW LEVEL SECURITY;

-- Now set up proper policies that don't create recursion
-- Allow any authenticated user to view
CREATE POLICY "Anyone can view bootcamp admins"
  ON bootcamp_admins FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only superadmins can manage bootcamp admins
CREATE POLICY "Superadmins can manage bootcamp admins"
  ON bootcamp_admins FOR ALL
  USING (
    auth.uid() IN (SELECT user_id FROM bootcamp_superadmins)
  );

-- Comment for manual steps:
-- After running this migration, manually add yourself as a superadmin using:
-- INSERT INTO bootcamp_superadmins (user_id) VALUES ('your-user-id');
-- Then add yourself as a bootcamp admin:
-- INSERT INTO bootcamp_admins (discord_username) VALUES ('your-discord-username');
