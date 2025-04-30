-- Consolidated Migration: 01_base_schema.sql
-- Description: Initial database schema with profiles, ideas, and comments

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  full_name TEXT,
  avatar_url TEXT,
  discord_username TEXT UNIQUE,
  x_handle TEXT,
  linkedin_url TEXT,
  github_username TEXT,
  instagram_handle TEXT,
  threads_handle TEXT,
  youtube_url TEXT,
  bio TEXT,
  skills TEXT[],
  status_tags TEXT[],
  custom_links JSONB DEFAULT '[]'::jsonb,
  nspals_profile_url TEXT,
  email TEXT COMMENT 'User email from authentication provider'
);

-- Create stays table
CREATE TABLE public.ns_stays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  start_month DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create ideas table
CREATE TABLE public.ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitter_user_id UUID REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Ideation',
  looking_for_tags TEXT[],
  is_archived BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create idea members table
CREATE TABLE public.idea_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'Member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create idea comments table
CREATE TABLE public.idea_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create feedbacks table
CREATE TABLE public.feedbacks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create discord whitelist table
CREATE TABLE public.discord_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ns_stays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discord_whitelist ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies for profiles
CREATE POLICY "Anyone can view profiles"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can create their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Basic RLS policies for stays
CREATE POLICY "Anyone can view NS stays"
  ON public.ns_stays FOR SELECT USING (true);

CREATE POLICY "Users can manage own NS stays"
  ON public.ns_stays USING (auth.uid() = user_id);

-- Basic RLS policies for ideas
CREATE POLICY "Anyone can view ideas"
  ON public.ideas FOR SELECT USING (true);

CREATE POLICY "Users can create ideas"
  ON public.ideas FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Submitters can update ideas"
  ON public.ideas FOR UPDATE USING (auth.uid() = submitter_user_id);

CREATE POLICY "Owners can delete ideas"
  ON public.ideas FOR DELETE USING (auth.uid() = submitter_user_id);

-- Basic RLS policies for idea members
CREATE POLICY "Anyone can view idea members"
  ON public.idea_members FOR SELECT USING (true);

CREATE POLICY "Users can become idea members"
  ON public.idea_members FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Submitters can manage team members"
  ON public.idea_members FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.ideas i
      WHERE i.id = idea_id AND i.submitter_user_id = auth.uid()
    )
  );

CREATE POLICY "Idea owners can remove team members"
  ON public.idea_members FOR DELETE USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.ideas i
      WHERE i.id = idea_id AND i.submitter_user_id = auth.uid()
    )
  );

-- Basic RLS policies for comments
CREATE POLICY "Anyone can view idea comments"
  ON public.idea_comments FOR SELECT USING (true);

CREATE POLICY "Users can add comments"
  ON public.idea_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON public.idea_comments FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.idea_comments FOR DELETE USING (auth.uid() = user_id);

-- Basic RLS policies for feedbacks
CREATE POLICY "Anyone can view feedbacks"
  ON public.feedbacks FOR SELECT USING (true);

CREATE POLICY "Users can create feedbacks"
  ON public.feedbacks FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own feedbacks"
  ON public.feedbacks FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own feedbacks"
  ON public.feedbacks FOR DELETE USING (auth.uid() = user_id);

-- Basic RLS policies for discord whitelist
CREATE POLICY "Allow authenticated users to read whitelist" ON public.discord_whitelist
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow service role to manage whitelist" ON public.discord_whitelist
  USING (auth.role() = 'service_role'); 