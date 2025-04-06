# Development Checklist: NS Connect Platform

**Stack:** Next.js 15 (App Router), Supabase, TypeScript, Tailwind CSS
**Project Setup:** `npx create-next-app -e with-supabase`

## Phase 1: Setup & Authentication

- [ ] **Project Initialization:**
  - [ ] Run `npx create-next-app -e with-supabase ns-idea-build` (or desired name).
  - [ ] Initialize Git repository.
- [ ] **Supabase Setup:**
  - [ ] Create a new Supabase project.
  - [ ] Configure Supabase project URL and Anon Key in `.env.local`.
  - [ ] Set up Supabase CLI (`supabase init`, `supabase login`, `supabase link`).
  - [ ] Configure OAuth providers (Google, Apple, Discord) in Supabase Auth settings. Get Client IDs/Secrets.
  - [ ] Add necessary Redirect URIs to Supabase Auth settings and OAuth provider configurations.
  - [ ] Update `AUTH_REDIRECT_TO` in Next.js middleware if needed.
- [ ] **Authentication Flow:**
  - [ ] Create Login page with buttons for Google, Apple, Discord sign-in.
  - [ ] Implement sign-in logic using Supabase Auth client (`supabase.auth.signInWithOAuth`).
  - [ ] Implement sign-out logic (`supabase.auth.signOut`).
  - [ ] Verify cookie-based session management is working correctly via the template.
  - [ ] Create protected routes/layout that require authentication.
  - [ ] Handle Auth callbacks and potential errors.

## Phase 2: Database Schema (Supabase)

- [ ] **Define Tables (using Supabase Studio or SQL migrations):**
  - [ ] **`profiles` Table:**
    - `id` (uuid, primary key, default `uuid_generate_v4()`, references `auth.users.id`)
    - `created_at` (timestamp with time zone, default `now()`)
    - `updated_at` (timestamp with time zone, default `now()`)
    - `full_name` (text)
    - `avatar_url` (text, nullable) - Store URL to image (potentially Supabase Storage)
    - `discord_username` (text, nullable, unique)
    - `x_handle` (text, nullable)
    - `linkedin_url` (text, nullable)
    - `github_username` (text, nullable)
    - `instagram_handle` (text, nullable)
    - `threads_handle` (text, nullable)
    - `youtube_url` (text, nullable)
    - `bio` (text, nullable)
    - `background` (text, nullable)
    - `skills` (text[], nullable) - Array of skill tags
    - `status_tags` (text[], nullable) - Array of predefined status tags
    - `custom_links` (jsonb, nullable, default `'[]'::jsonb`) - Array of objects like `[{label: string, url: string}]`
    - `nspals_profile_url` (text, nullable) - Store derived URL
  - [ ] **`ns_stays` Table:** (To track multiple participation periods)
    - `id` (uuid, primary key, default `uuid_generate_v4()`)
    - `user_id` (uuid, foreign key references `profiles.id`, `on delete cascade`)
    - `start_month` (date) - Store as the 1st of the month (e.g., '2024-07-01')
    - `end_month` (date, nullable) - Optional if tracking duration or continuous stay
    - `created_at` (timestamp with time zone, default `now()`)
  - [ ] **`ideas` Table:**
    - `id` (uuid, primary key, default `uuid_generate_v4()`)
    - `created_at` (timestamp with time zone, default `now()`)
    - `updated_at` (timestamp with time zone, default `now()`)
    - `last_activity_at` (timestamp with time zone, default `now()`)
    - `submitter_user_id` (uuid, foreign key references `profiles.id`)
    - `title` (text, not null)
    - `description` (text, not null)
    - `status` (text, default `'Ideation'`) - Consider Enum type if DB supports, or use check constraint
    - `looking_for_tags` (text[], nullable) - Array of needs tags
    - `is_archived` (boolean, default `false`)
  - [ ] **`idea_members` Table:** (Junction table for users working on ideas)
    - `id` (uuid, primary key, default `uuid_generate_v4()`)
    - `idea_id` (uuid, foreign key references `ideas.id`, `on delete cascade`)
    - `user_id` (uuid, foreign key references `profiles.id`, `on delete cascade`)
    - `role` (text, default `'Member'`) - e.g., 'Originator', 'Member'
    - `joined_at` (timestamp with time zone, default `now()`)
    - Unique constraint on (`idea_id`, `user_id`)
  - [ ] **`idea_comments` Table:** (For updates/activity)
    - `id` (uuid, primary key, default `uuid_generate_v4()`)
    - `idea_id` (uuid, foreign key references `ideas.id`, `on delete cascade`)
    - `user_id` (uuid, foreign key references `profiles.id`, `on delete set null` or `cascade`)
    - `comment_text` (text, not null)
    - `created_at` (timestamp with time zone, default `now()`)
- [ ] **Database Functions/Triggers:**
  - [ ] Trigger on `profiles` insert/update to sync `id` from `auth.users` if needed (template might handle this).
  - [ ] Trigger on `idea_comments` insert to update `ideas.last_activity_at` for the corresponding idea.
  - [ ] Trigger to update `updated_at` columns on relevant tables.
  - [ ] (Optional) Function/trigger to calculate `nspals_profile_url` when `discord_username` changes.
  - [ ] (Optional) Scheduled Function (Supabase Edge Function) to check `last_activity_at` and set `is_archived = true` for inactive ideas.
- [ ] **Row Level Security (RLS):**
  - [ ] Enable RLS for all relevant tables (`profiles`, `ideas`, `idea_members`, `idea_comments`, `ns_stays`).
  - [ ] Policy: Users can view all profiles/ideas/comments (it's an internal tool).
  - [ ] Policy: Users can only update/delete their _own_ profile data.
  - [ ] Policy: Users can insert ideas. Idea submitter can update core idea details (title, desc, status).
  - [ ] Policy: Idea members/submitter can add/remove other members (might need a function).
  - [ ] Policy: Authenticated users can insert comments. Comment owners can edit/delete their own comments (optional).
  - [ ] Policy: Users can manage their own `ns_stays`.

## Phase 3: Core Feature Implementation (Backend Logic & Frontend UI)

- [ ] **User Profile Management:**
  - [ ] **Frontend:** Create Profile page (`/profile/me` or `/profile/[userId]`).
  - [ ] **Frontend:** Form for editing profile details (Name, Bio, Links, Skills, Tags, NS Stays).
  - [ ] **Frontend:** UI for displaying profile information including links, tags, NS stays.
  - [ ] **Frontend:** Component for profile picture upload (using Supabase Storage).
  - [ ] **Backend (API Route/Server Action):** Endpoint/Action to fetch user profile data (including related data like NS Stays).
  - [ ] **Backend (API Route/Server Action):** Endpoint/Action to update user profile data.
  - [ ] **Backend (API Route/Server Action):** Endpoint/Action to manage NS Stays (add/remove months).
  - [ ] **Logic:** Generate and save `nspals_profile_url` when `discord_username` is set/updated.
- [ ] **Idea Submission:**
  - [ ] **Frontend:** Create Idea submission form (Modal or dedicated page `/ideas/new`).
  - [ ] **Backend (API Route/Server Action):** Endpoint/Action to handle new idea creation.
    - Link `submitter_user_id` to the logged-in user.
    - Add submitter to `idea_members` table with 'Originator' role.
- [ ] **Idea Viewing & Details:**
  - [ ] **Frontend:** Create Idea detail page (`/ideas/[ideaId]`).
  - [ ] **Frontend:** Display idea title, description, status, 'Looking For' tags.
  - [ ] **Frontend:** Display list of team members (with links to their profiles).
  - [ ] **Frontend:** Display comment/update feed.
  - [ ] **Frontend:** Form to add new comments/updates.
  - [ ] **Backend (API Route/Server Action):** Endpoint to fetch detailed idea data (including members, comments).
  - [ ] **Backend (API Route/Server Action):** Endpoint/Action to add a comment (updates `last_activity_at`).
  - [ ] **Frontend/Backend:** Logic for updating idea status and 'Looking For' tags (permissions for submitter/members).
  - [ ] **Frontend/Backend:** Logic for adding/removing team members (permissions).
- [ ] **People Directory:**
  - [ ] **Frontend:** Create page (`/people`) to display users.
  - [ ] **Frontend:** Implement List/Grid view component for user cards.
  - [ ] **Frontend:** Implement filtering UI (by Skill, Status Tag, NS Month).
  - [ ] **Backend (API Route/Server Action):** Endpoint to fetch users with filtering and pagination.
- [ ] **Idea Hub:**
  - [ ] **Frontend:** Create page (`/ideas`) to display ideas.
  - [ ] **Frontend:** Implement List View component.
  - [ ] **Frontend:** Implement Kanban View component (using state or a library).
  - [ ] **Frontend:** Implement filtering/sorting UI (Status, Tags, Activity, etc.). Handle display of 'faded' inactive items. Filter out archived by default.
  - [ ] **Backend (API Route/Server Action):** Endpoint to fetch ideas with filtering, sorting, and pagination. Include logic to determine 'inactive' status based on `last_activity_at`. Exclude archived unless requested.
  - [ ] (Optional V2) Implement Timeline View component.

## Phase 4: UI/UX & Styling

- [ ] **Tailwind CSS Implementation:**
  - [ ] Apply consistent styling across all components based on Tailwind defaults or a custom theme.
  - [ ] Ensure responsive design for key pages (Profile, Ideas Hub, Idea Detail).
- [ ] **Component Library:**
  - [ ] Create reusable components (Buttons, Cards, Modals, Forms, Tags, Avatars).
- [ ] **User Experience:**
  - [ ] Ensure smooth navigation between pages.
  - [ ] Provide clear visual feedback for actions (saving, loading, errors).
  - [ ] Implement loading states for data fetching.
  - [ ] Implement simple forms for profile editing and idea submission.

## Phase 5: Testing

- [ ] **Unit Tests:** Test utility functions, potentially complex components (optional).
- [ ] **Integration Tests:** Test API routes/Server Actions interaction with Supabase.
- [ ] **E2E Tests (Optional but Recommended):**
  - [ ] Test user flows (Sign up/in, profile update, idea submission, commenting, browsing). Use Cypress or Playwright.
- [ ] **Manual Testing:** Thoroughly test all features across different browsers/devices. Test RLS policies.

## Phase 6: Deployment

- [ ] **Environment Variables:**
  - [ ] Configure production environment variables for Supabase URL/Key.
  - [ ] Configure OAuth redirect URIs for production deployment URL.
- [ ] **Platform Choice:** Choose hosting (Vercel/Netlify recommended).
- [ ] **Deployment Process:**
  - [ ] Set up Git-based deployment.
  - [ ] Configure build settings.
- [ ] **Custom Domain (Optional):** Configure DNS if using a custom domain.
- [ ] **Supabase Production Checklist:** Review Supabase Go-Live checklist (DB backups, monitoring, etc.).

## Phase 7: Post-Launch & Maintenance

- [ ] **Monitoring:** Set up basic logging and error tracking (Vercel Analytics, Sentry).
- [ ] **Feedback:** Establish a channel for user feedback (e.g., a dedicated Discord channel, feedback form).
- [ ] **Bug Fixing:** Address issues reported by users.
- [ ] **Iteration:** Plan for V1.1 features based on feedback and the "Future Considerations" list.
- [ ] **Database Maintenance:** Monitor performance, consider indexing strategies as data grows. Ensure archiving logic is working.
