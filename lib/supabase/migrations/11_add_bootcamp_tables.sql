-- Create NS Bootcamp tables
-- This migration adds tables for managing NS Bootcamp groups, ideas, and slides

-- Create bootcamp_groups table
CREATE TABLE IF NOT EXISTS "bootcamp_groups" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" TEXT NOT NULL,
  "group_number" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create bootcamp_group_ideas junction table
CREATE TABLE IF NOT EXISTS "bootcamp_group_ideas" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "group_id" UUID NOT NULL REFERENCES "bootcamp_groups"("id") ON DELETE CASCADE,
  "idea_id" UUID NOT NULL REFERENCES "ideas"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("group_id", "idea_id")
);

-- Create bootcamp_slides table
CREATE TABLE IF NOT EXISTS "bootcamp_slides" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "idea_id" UUID NOT NULL REFERENCES "ideas"("id") ON DELETE CASCADE,
  "week_number" INTEGER NOT NULL,
  "team_members" TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  "elevator_pitch" TEXT,
  "completed_items" TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  "next_week_items" TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  "image_url" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "created_by" UUID REFERENCES "profiles"("id") ON DELETE SET NULL,
  "updated_by" UUID REFERENCES "profiles"("id") ON DELETE SET NULL,
  UNIQUE("idea_id", "week_number")
);

-- Store admin usernames for bootcamp
CREATE TABLE IF NOT EXISTS "bootcamp_admins" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "discord_username" TEXT NOT NULL UNIQUE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create triggers and functions

-- Trigger to update updated_at on bootcamp_groups
CREATE TRIGGER update_bootcamp_groups_updated_at
BEFORE UPDATE ON bootcamp_groups
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Trigger to update updated_at on bootcamp_slides
CREATE TRIGGER update_bootcamp_slides_updated_at
BEFORE UPDATE ON bootcamp_slides
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Set up Row Level Security (RLS)
ALTER TABLE bootcamp_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE bootcamp_group_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE bootcamp_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE bootcamp_admins ENABLE ROW LEVEL SECURITY;

-- Create policies

-- Bootcamp groups policies
-- Anyone can view bootcamp groups
CREATE POLICY "Anyone can view bootcamp groups"
  ON bootcamp_groups FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only bootcamp admins can manage bootcamp groups
CREATE POLICY "Admins can manage bootcamp groups"
  ON bootcamp_groups FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM bootcamp_admins
      JOIN profiles ON profiles.discord_username = bootcamp_admins.discord_username
      WHERE profiles.id = auth.uid()
    )
  );

-- Bootcamp group ideas policies
-- Anyone can view bootcamp group ideas
CREATE POLICY "Anyone can view bootcamp group ideas"
  ON bootcamp_group_ideas FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only bootcamp admins can manage bootcamp group ideas
CREATE POLICY "Admins can manage bootcamp group ideas"
  ON bootcamp_group_ideas FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM bootcamp_admins
      JOIN profiles ON profiles.discord_username = bootcamp_admins.discord_username
      WHERE profiles.id = auth.uid()
    )
  );

-- Bootcamp slides policies
-- Anyone can view bootcamp slides
CREATE POLICY "Anyone can view bootcamp slides"
  ON bootcamp_slides FOR SELECT
  USING (auth.role() = 'authenticated');

-- Idea members can update their own idea's bootcamp slides
CREATE POLICY "Idea members can insert bootcamp slides"
  ON bootcamp_slides FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM idea_members
      WHERE idea_members.idea_id = bootcamp_slides.idea_id
      AND idea_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Idea members can update bootcamp slides"
  ON bootcamp_slides FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM idea_members
      WHERE idea_members.idea_id = bootcamp_slides.idea_id
      AND idea_members.user_id = auth.uid()
    )
  );

-- Bootcamp admins can manage all slides
CREATE POLICY "Admins can manage all bootcamp slides"
  ON bootcamp_slides FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM bootcamp_admins
      JOIN profiles ON profiles.discord_username = bootcamp_admins.discord_username
      WHERE profiles.id = auth.uid()
    )
  );

-- Bootcamp admins policies
-- Anyone can view bootcamp admins
CREATE POLICY "Anyone can view bootcamp admins"
  ON bootcamp_admins FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only bootcamp admins can manage bootcamp admins
CREATE POLICY "Admins can manage bootcamp admins"
  ON bootcamp_admins FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM bootcamp_admins
      JOIN profiles ON profiles.discord_username = bootcamp_admins.discord_username
      WHERE profiles.id = auth.uid()
    )
  );
