-- Migration: Add RLS Policies for Public Read Access
-- Timestamp: 20250430003300

-- Enable RLS for tables (if not already enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_members ENABLE ROW LEVEL SECURITY; -- Assuming this table exists and is needed

-- Grant SELECT access to 'authenticated' role for profiles
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.profiles;
CREATE POLICY "Allow authenticated read access" ON public.profiles
FOR SELECT
TO authenticated -- Only allow authenticated users to read
USING (true);

-- Grant SELECT access to 'authenticated' role for feedbacks
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.feedbacks;
CREATE POLICY "Allow authenticated read access" ON public.feedbacks
FOR SELECT
TO authenticated
USING (true);

-- Grant SELECT access to 'authenticated' role for idea_comments
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.idea_comments;
CREATE POLICY "Allow authenticated read access" ON public.idea_comments
FOR SELECT
TO authenticated
USING (true);

-- Grant SELECT access to 'authenticated' role for ideas
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.ideas;
CREATE POLICY "Allow authenticated read access" ON public.ideas
FOR SELECT
TO authenticated
USING (true);

-- Grant SELECT access to 'authenticated' role for idea_members (if applicable)
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.idea_members;
CREATE POLICY "Allow authenticated read access" ON public.idea_members
FOR SELECT
TO authenticated
USING (true);
