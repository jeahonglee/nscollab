-- Revert changes from migrations 11, 12, and 13 related to bootcamp tables

-- Drop Policies
DROP POLICY IF EXISTS "Anyone can view bootcamp groups" ON bootcamp_groups;
DROP POLICY IF EXISTS "Admins can manage bootcamp groups" ON bootcamp_groups;

DROP POLICY IF EXISTS "Anyone can view bootcamp group ideas" ON bootcamp_group_ideas;
DROP POLICY IF EXISTS "Admins can manage bootcamp group ideas" ON bootcamp_group_ideas;

DROP POLICY IF EXISTS "Anyone can view bootcamp slides" ON bootcamp_slides;
DROP POLICY IF EXISTS "Idea members can insert bootcamp slides" ON bootcamp_slides;
DROP POLICY IF EXISTS "Idea members can update bootcamp slides" ON bootcamp_slides;
DROP POLICY IF EXISTS "Admins can manage all bootcamp slides" ON bootcamp_slides;

DROP POLICY IF EXISTS "Anyone can view bootcamp admins" ON bootcamp_admins;
DROP POLICY IF EXISTS "Admins can manage bootcamp admins" ON bootcamp_admins; -- from migration 11
DROP POLICY IF EXISTS "Superadmins can manage bootcamp admins" ON bootcamp_admins; -- from migration 12
DROP POLICY IF EXISTS "Initial bootstrap admin or current admins can manage bootcamp admins" ON bootcamp_admins; -- mentioned in drops
DROP POLICY IF EXISTS "Only current admins can manage bootcamp admins" ON bootcamp_admins; -- mentioned in drops

-- Remove Comment
COMMENT ON TABLE bootcamp_admins IS NULL;

-- Drop Triggers
DROP TRIGGER IF EXISTS update_bootcamp_groups_updated_at ON bootcamp_groups;
DROP TRIGGER IF EXISTS update_bootcamp_slides_updated_at ON bootcamp_slides;

-- Drop Tables (in reverse order of dependency)
DROP TABLE IF EXISTS bootcamp_superadmins;
DROP TABLE IF EXISTS bootcamp_admins;
DROP TABLE IF EXISTS bootcamp_slides;
DROP TABLE IF EXISTS bootcamp_group_ideas;
DROP TABLE IF EXISTS bootcamp_groups;
