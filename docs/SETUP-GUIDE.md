# Setup Guide for NS Collab Platform

This guide provides detailed instructions for setting up and configuring the NS Collab Platform for both local development and production deployment.

## Prerequisites

- **Node.js**: Version 18 or later (recommended for Next.js 15)
- **npm**, **yarn**, or **pnpm**: For package management
- **Git**: For version control
- **Supabase Account**: For database, authentication, and storage
- **OAuth Provider Credentials**: For Google, Apple, and/or Discord login

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ns-collab
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set Up Supabase Project

1. Create a new Supabase project at [https://database.new](https://database.new)
2. Note your Supabase project URL and anon key from the project settings
3. Set up the database schema:
   - Follow the schema defined in [DEV-CHECKLIST.md](./DEV-CHECKLIST.md) under Phase 2
   - You can use the Supabase web UI (Table Editor) or SQL queries in the SQL Editor
   - Set up Row Level Security (RLS) policies as defined in the checklist

### 4. Configure Authentication Providers

In your Supabase project's Authentication settings:

1. Enable the Email provider for testing
2. Configure OAuth providers:
   - **Google**: Set up a project in Google Cloud Console, create OAuth credentials
   - **Apple**: Configure Apple Sign In from the Apple Developer portal
   - **Discord**: Create an application in the Discord Developer Portal

For each provider, set the redirect URL to `http://localhost:3000/auth/callback` for local development.

### 5. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>

# OAuth Client IDs (if needed directly in the app)
# GOOGLE_CLIENT_ID=<your-google-client-id>
# APPLE_CLIENT_ID=<your-apple-client-id>
# DISCORD_CLIENT_ID=<your-discord-client-id>

# Other environment variables
# ...
```

### 6. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

The application should now be running at [http://localhost:3000](http://localhost:3000).

## Database Schema Setup

To set up the database schema manually, you can run the following SQL in your Supabase SQL editor:

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  discord_username TEXT UNIQUE,
  x_handle TEXT,
  linkedin_url TEXT,
  github_username TEXT,
  instagram_handle TEXT,
  threads_handle TEXT,
  youtube_url TEXT,
  email TEXT,
  bio TEXT,
  skills TEXT[],
  status_tags TEXT[],
  custom_links JSONB DEFAULT '[]'::jsonb,
  nspals_profile_url TEXT
);

-- Create ns_stays table
CREATE TABLE IF NOT EXISTS public.ns_stays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  active_months TEXT[],
  start_month DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Create ideas table
CREATE TABLE IF NOT EXISTS public.ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  submitter_user_id UUID REFERENCES public.profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'Ideation' NOT NULL,
  looking_for_tags TEXT[],
  is_archived BOOLEAN DEFAULT false NOT NULL
);

-- Create idea_members table
CREATE TABLE IF NOT EXISTS public.idea_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'Member' NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (idea_id, user_id)
);

-- Create idea_comments table
CREATE TABLE IF NOT EXISTS public.idea_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create trigger to update last_activity_at on idea when comment is added
CREATE OR REPLACE FUNCTION update_idea_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.ideas
  SET last_activity_at = NEW.created_at
  WHERE id = NEW.idea_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_idea_activity
AFTER INSERT ON public.idea_comments
FOR EACH ROW
EXECUTE FUNCTION update_idea_last_activity();

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ideas_updated_at
BEFORE UPDATE ON public.ideas
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ns_stays_updated_at
BEFORE UPDATE ON public.ns_stays
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

## Row Level Security (RLS) Setup

```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ns_stays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_comments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Allow users to view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow users to update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Allow users to delete their own profile"
ON public.profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- NS Stays policies
CREATE POLICY "Allow users to view all NS stays"
ON public.ns_stays FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow users to insert their own NS stays"
ON public.ns_stays FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Allow users to update their own NS stays"
ON public.ns_stays FOR UPDATE
TO authenticated
USING (auth.uid() = profile_id);

CREATE POLICY "Allow users to delete their own NS stays"
ON public.ns_stays FOR DELETE
TO authenticated
USING (auth.uid() = profile_id);

-- Ideas policies
CREATE POLICY "Allow users to view all ideas"
ON public.ideas FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert ideas"
ON public.ideas FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = submitter_user_id);

CREATE POLICY "Allow idea submitters to update their ideas"
ON public.ideas FOR UPDATE
TO authenticated
USING (auth.uid() = submitter_user_id);

-- Idea Members policies
CREATE POLICY "Allow users to view all idea members"
ON public.idea_members FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow idea members to add new members"
ON public.idea_members FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.idea_members
    WHERE idea_id = NEW.idea_id AND user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.ideas
    WHERE id = NEW.idea_id AND submitter_user_id = auth.uid()
  )
);

CREATE POLICY "Allow idea members and submitters to remove members"
ON public.idea_members FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.idea_members
    WHERE idea_id = idea_id AND user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.ideas
    WHERE id = idea_id AND submitter_user_id = auth.uid()
  )
);

-- Idea Comments policies
CREATE POLICY "Allow users to view all idea comments"
ON public.idea_comments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert comments"
ON public.idea_comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own comments"
ON public.idea_comments FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own comments"
ON public.idea_comments FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

## Production Deployment

### Deploying to Vercel

1. Push your code to a Git repository (GitHub, GitLab, Bitbucket)
2. Connect your repository to Vercel
3. Configure the build settings:
   - Framework preset: Next.js
   - Build command: `next build`
   - Output directory: `.next`
4. Add the same environment variables as in your local development setup
5. Configure production OAuth redirect URLs in your OAuth providers to point to your production domain

### Configuring a Custom Domain (Optional)

1. In Vercel, go to your project's dashboard
2. Navigate to "Domains"
3. Add your custom domain
4. Update DNS settings as instructed by Vercel
5. Update your OAuth redirect URLs to use the custom domain

## Monitoring and Maintenance

- **Vercel Analytics**: Available in the Vercel dashboard
- **Supabase Monitoring**: Check the Supabase dashboard for database usage, performance, and errors
- **Database Maintenance**:
  - Set up periodic backups via Supabase
  - Monitor database performance and consider indexing as usage grows

## Common Issues and Troubleshooting

### Authentication Problems

- Check that OAuth redirect URLs are correctly configured in both Supabase and the OAuth provider dashboards
- Verify that environment variables are correctly set
- Check browser console for CORS errors

### Database Permissions

- If users can't access data, verify that RLS policies are correctly set up
- Test RLS policies with the Supabase dashboard's policy tester

### Next.js Build Issues

- Clear `.next` cache: `rm -rf .next`
- Update dependencies: `npm update` or equivalent with your package manager
- Check for TypeScript errors: `npx tsc --noEmit`
