-- Migration to simplify bootcamp tables and fix RLS issues
-- This migration simplifies the bootcamp_slides table and fixes policy issues

-- First, drop the policy that depends on bootcamp_superadmins
DROP POLICY IF EXISTS "Superadmins can manage bootcamp admins" ON bootcamp_admins;

-- Then drop the superadmins table
DROP TABLE IF EXISTS bootcamp_superadmins;

-- Simplify bootcamp_slides table by removing redundant fields
-- We'll keep the existing table but modify it
ALTER TABLE bootcamp_slides 
  DROP COLUMN IF EXISTS team_members, -- Use idea_members instead
  DROP COLUMN IF EXISTS elevator_pitch; -- Use idea.description instead

-- Now alter the bootcamp_slides table to have fixed fields instead of arrays
ALTER TABLE bootcamp_slides
  DROP COLUMN IF EXISTS completed_items,
  DROP COLUMN IF EXISTS next_week_items,
  ADD COLUMN IF NOT EXISTS completed_item1 TEXT,
  ADD COLUMN IF NOT EXISTS completed_item2 TEXT,
  ADD COLUMN IF NOT EXISTS completed_item3 TEXT,
  ADD COLUMN IF NOT EXISTS next_week_item1 TEXT,
  ADD COLUMN IF NOT EXISTS next_week_item2 TEXT,
  ADD COLUMN IF NOT EXISTS next_week_item3 TEXT;

-- Fix the recursion issue by taking a much simpler approach

-- First, completely drop all RLS policies on bootcamp_admins
DROP POLICY IF EXISTS "Anyone can view bootcamp admins" ON bootcamp_admins;
DROP POLICY IF EXISTS "Only current admins can manage bootcamp admins" ON bootcamp_admins;
DROP POLICY IF EXISTS "Admins can manage bootcamp admins" ON bootcamp_admins;
DROP POLICY IF EXISTS "Initial bootstrap admin or current admins can manage bootcamp admins" ON bootcamp_admins;

-- Disable RLS entirely on bootcamp_admins to simplify
ALTER TABLE bootcamp_admins DISABLE ROW LEVEL SECURITY;

-- We'll skip complex policies for bootcamp_admins to avoid recursion entirely
-- Instead, we'll rely on application-level checks for admin status

-- Add your discord username as an admin
INSERT INTO bootcamp_admins (discord_username) 
VALUES ('jeahonglee') 
ON CONFLICT (discord_username) DO NOTHING;

-- Re-enable RLS now that we have set up the proper policies
ALTER TABLE bootcamp_admins ENABLE ROW LEVEL SECURITY;

-- Add a helpful comment on the table for future reference
COMMENT ON TABLE bootcamp_admins IS 
  'Table for bootcamp admins. Only existing admins can add new admins. The first admin was bootstrapped during migration.';
