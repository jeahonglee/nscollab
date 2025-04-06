-- Create NS Connect Platform database schema
-- Based on development checklist specifications

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS "profiles" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "full_name" TEXT,
  "avatar_url" TEXT,
  "discord_username" TEXT UNIQUE,
  "x_handle" TEXT,
  "linkedin_url" TEXT,
  "github_username" TEXT,
  "instagram_handle" TEXT,
  "threads_handle" TEXT,
  "youtube_url" TEXT,
  "bio" TEXT,
  "background" TEXT,
  "skills" TEXT[],
  "status_tags" TEXT[],
  "custom_links" JSONB DEFAULT '[]'::jsonb,
  "nspals_profile_url" TEXT
);

-- Create NS stays table (tracks multiple participation periods)
CREATE TABLE IF NOT EXISTS "ns_stays" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "start_month" DATE NOT NULL, -- Store as the 1st of the month (e.g., '2024-07-01')
  "end_month" DATE, -- Optional if tracking duration or continuous stay
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create ideas table
CREATE TABLE IF NOT EXISTS "ideas" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "last_activity_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "submitter_user_id" UUID NOT NULL REFERENCES "profiles"("id"),
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Ideation', -- Consider using Enum if DB supports
  "looking_for_tags" TEXT[],
  "is_archived" BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create idea members junction table
CREATE TABLE IF NOT EXISTS "idea_members" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "idea_id" UUID NOT NULL REFERENCES "ideas"("id") ON DELETE CASCADE,
  "user_id" UUID NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "role" TEXT NOT NULL DEFAULT 'Member', -- e.g., 'Originator', 'Member'
  "joined_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("idea_id", "user_id")
);

-- Create idea comments table
CREATE TABLE IF NOT EXISTS "idea_comments" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "idea_id" UUID NOT NULL REFERENCES "ideas"("id") ON DELETE CASCADE,
  "user_id" UUID REFERENCES "profiles"("id") ON DELETE SET NULL,
  "comment_text" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create triggers and functions

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Trigger to update updated_at on ideas
CREATE TRIGGER update_ideas_updated_at
BEFORE UPDATE ON ideas
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Function to update last_activity_at on ideas when a comment is added
CREATE OR REPLACE FUNCTION update_idea_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ideas
  SET last_activity_at = now()
  WHERE id = NEW.idea_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_activity_at when a comment is added
CREATE TRIGGER update_idea_last_activity_trigger
AFTER INSERT ON idea_comments
FOR EACH ROW
EXECUTE FUNCTION update_idea_last_activity();

-- Function to generate nspals_profile_url when discord_username is set
CREATE OR REPLACE FUNCTION generate_nspals_url()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.discord_username IS NOT NULL THEN
    NEW.nspals_profile_url = 'https://nspals.com/' || NEW.discord_username;
  ELSE
    NEW.nspals_profile_url = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to generate nspals_profile_url when discord_username is changed
CREATE TRIGGER generate_nspals_url_trigger
BEFORE INSERT OR UPDATE OF discord_username ON profiles
FOR EACH ROW
EXECUTE FUNCTION generate_nspals_url();

-- Set up Row Level Security (RLS)
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ns_stays ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_comments ENABLE ROW LEVEL SECURITY;

-- Create policies

-- Profiles policies
-- Everyone can view profiles (it's an internal tool)
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- NS Stays policies
-- Anyone can view NS stays
CREATE POLICY "Anyone can view NS stays"
  ON ns_stays FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can manage their own NS stays
CREATE POLICY "Users can manage own NS stays"
  ON ns_stays FOR ALL
  USING (auth.uid() = user_id);

-- Ideas policies
-- Anyone can view ideas
CREATE POLICY "Anyone can view ideas"
  ON ideas FOR SELECT
  USING (auth.role() = 'authenticated');

-- Any authenticated user can create ideas
CREATE POLICY "Users can create ideas"
  ON ideas FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Only submitter can update their ideas
CREATE POLICY "Submitters can update ideas"
  ON ideas FOR UPDATE
  USING (auth.uid() = submitter_user_id);

-- Idea members policies
-- Anyone can view idea members
CREATE POLICY "Anyone can view idea members"
  ON idea_members FOR SELECT
  USING (auth.role() = 'authenticated');

-- Anyone can become a member of an idea
CREATE POLICY "Users can become idea members"
  ON idea_members FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Only the idea submitter can manage team members
CREATE POLICY "Submitters can manage team members"
  ON idea_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM ideas
      WHERE ideas.id = idea_members.idea_id
      AND ideas.submitter_user_id = auth.uid()
    )
    OR auth.uid() = user_id -- Allow users to remove themselves
  );

-- Idea comments policies
-- Anyone can view comments
CREATE POLICY "Anyone can view idea comments"
  ON idea_comments FOR SELECT
  USING (auth.role() = 'authenticated');

-- Anyone can add comments
CREATE POLICY "Users can add comments"
  ON idea_comments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Comment owners can update their comments
CREATE POLICY "Users can update own comments"
  ON idea_comments FOR UPDATE
  USING (auth.uid() = user_id);

-- Comment owners can delete their comments
CREATE POLICY "Users can delete own comments"
  ON idea_comments FOR DELETE
  USING (auth.uid() = user_id);
