# Development Checklist: NS Collab Platform

**Stack:** Next.js 15 (App Router), Supabase, TypeScript, Tailwind CSS
**Project Setup:** `npx create-next-app -e with-supabase`

## Phase 1: Setup & Authentication

- [x] **Project Initialization:**
  - [x] Run `npx create-next-app -e with-supabase ns-idea-build` (or desired name).
  - [x] Initialize Git repository.
- [x] **Supabase Setup:**
  - [x] Create a new Supabase project.
  - [x] Configure Supabase project URL and Anon Key in `.env.local`.
  - [x] Set up Supabase CLI (`supabase init`, `supabase login`, `supabase link`).
  - [x] Configure OAuth providers (Google, Apple, Discord) in Supabase Auth settings. Get Client IDs/Secrets.
  - [x] Add necessary Redirect URIs to Supabase Auth settings and OAuth provider configurations.
  - [x] Update `AUTH_REDIRECT_TO` in Next.js middleware if needed.
- [x] **Authentication Flow:**
  - [x] Create Login page with buttons for Google, Apple, Discord sign-in.
  - [x] Implement sign-in logic using Supabase Auth client (`supabase.auth.signInWithOAuth`).
  - [x] Implement sign-out logic (`supabase.auth.signOut`).
  - [x] Verify cookie-based session management is working correctly via the template.
  - [x] Create protected routes/layout that require authentication.
  - [x] Handle Auth callbacks and potential errors.

## Phase 2: Database Schema (Supabase)

- [x] **Define Tables (using Supabase Studio or SQL migrations):**
  - [x] **`profiles` Table:**
    - [x] `id` (uuid, primary key, default `uuid_generate_v4()`, references `auth.users.id`)
    - [x] `created_at` (timestamp with time zone, default `now()`)
    - [x] `updated_at` (timestamp with time zone, default `now()`)
    - [x] `full_name` (text)
    - [x] `avatar_url` (text, nullable) - Store URL to image (potentially Supabase Storage)
    - [x] `discord_username` (text, nullable, unique)
    - [x] `x_handle` (text, nullable)
    - [x] `linkedin_url` (text, nullable)
    - [x] `github_username` (text, nullable)
    - [x] `instagram_handle` (text, nullable)
    - [x] `threads_handle` (text, nullable)
    - [x] `youtube_url` (text, nullable)
    - [x] `bio` (text, nullable)
    - [x] `background` (text, nullable)
    - [x] `skills` (text[], nullable) - Array of skill tags
    - [x] `status_tags` (text[], nullable) - Array of predefined status tags
    - [x] `custom_links` (jsonb, nullable, default `'[]'::jsonb`) - Array of objects like `[{label: string, url: string}]`
    - [x] `nspals_profile_url` (text, nullable) - Store derived URL
  - [x] **`ns_stays` Table:** (To track multiple participation periods)
    - [x] `id` (uuid, primary key, default `uuid_generate_v4()`)
    - [x] `profile_id` (uuid, foreign key references `profiles.id`, `on delete cascade`)
    - [x] `active_months` (text[], nullable) - Store array of active months
    - [x] `start_month` (date, nullable) - Store as the 1st of the month (e.g., '2024-07-01')
    - [x] `created_at` (timestamp with time zone, default `now()`)
    - [x] `updated_at` (timestamp with time zone, nullable)
  - [x] **`ideas` Table:**
    - [x] `id` (uuid, primary key, default `uuid_generate_v4()`)
    - [x] `created_at` (timestamp with time zone, default `now()`)
    - [x] `updated_at` (timestamp with time zone, default `now()`)
    - [x] `last_activity_at` (timestamp with time zone, default `now()`)
    - [x] `submitter_user_id` (uuid, foreign key references `profiles.id`)
    - [x] `title` (text, not null)
    - [x] `description` (text, not null)
    - [x] `status` (text, default `'Ideation'`) - Consider Enum type if DB supports, or use check constraint
    - [x] `looking_for_tags` (text[], nullable) - Array of needs tags
    - [x] `is_archived` (boolean, default `false`)
  - [x] **`idea_members` Table:** (Junction table for users working on ideas)
    - [x] `id` (uuid, primary key, default `uuid_generate_v4()`)
    - [x] `idea_id` (uuid, foreign key references `ideas.id`, `on delete cascade`)
    - [x] `user_id` (uuid, foreign key references `profiles.id`, `on delete cascade`)
    - [x] `role` (text, default `'Member'`) - e.g., 'Originator', 'Member'
    - [x] `joined_at` (timestamp with time zone, default `now()`)
    - [x] Unique constraint on (`idea_id`, `user_id`)
  - [x] **`idea_comments` Table:** (For updates/activity)
    - [x] `id` (uuid, primary key, default `uuid_generate_v4()`)
    - [x] `idea_id` (uuid, foreign key references `ideas.id`, `on delete cascade`)
    - [x] `user_id` (uuid, foreign key references `profiles.id`, `on delete set null` or `cascade`)
    - [x] `comment_text` (text, not null)
    - [x] `created_at` (timestamp with time zone, default `now()`)
- [x] **Database Functions/Triggers:**
  - [x] Trigger on `profiles` insert/update to sync `id` from `auth.users` if needed (template might handle this).
  - [x] Trigger on `idea_comments` insert to update `ideas.last_activity_at` for the corresponding idea.
  - [x] Trigger to update `updated_at` columns on relevant tables.
  - [x] (Optional) Function/trigger to calculate `nspals_profile_url` when `discord_username` changes.
  - [ ] (Optional) Scheduled Function (Supabase Edge Function) to check `last_activity_at` and set `is_archived = true` for inactive ideas.
- [x] **Row Level Security (RLS):**
  - [x] Enable RLS for all relevant tables (`profiles`, `ideas`, `idea_members`, `idea_comments`, `ns_stays`).
  - [x] Policy: Users can view all profiles/ideas/comments (it's an internal tool).
  - [x] Policy: Users can only update/delete their _own_ profile data.
  - [x] Policy: Users can insert ideas. Idea submitter can update core idea details (title, desc, status).
  - [x] Policy: Idea members/submitter can add/remove other members (might need a function).
  - [x] Policy: Authenticated users can insert comments. Comment owners can edit/delete their own comments (optional).
  - [x] Policy: Users can manage their own `ns_stays`.

## Phase 3: Core Feature Implementation (Backend Logic & Frontend UI)

- [x] **User Profile Management:**
  - [x] **Frontend:** Create Profile page (`/profile/me` or `/profile/[userId]`).
  - [x] **Frontend:** Form for editing profile details (Name, Bio, Links, Skills, Tags, NS Stays).
  - [x] **Frontend:** UI for displaying profile information including links, tags, NS stays.
  - [x] **Frontend:** Component for profile picture upload (using Supabase Storage).
  - [x] **Backend (API Route/Server Action):** Endpoint/Action to fetch user profile data (including related data like NS Stays).
  - [x] **Backend (API Route/Server Action):** Endpoint/Action to update user profile data.
  - [x] **Backend (API Route/Server Action):** Endpoint/Action to manage NS Stays (add/remove months).
  - [x] **Logic:** Generate and save `nspals_profile_url` when `discord_username` is set/updated.
- [x] **Idea Submission:**
  - [x] **Frontend:** Create Idea submission form (Modal or dedicated page `/ideas/new`).
  - [x] **Backend (API Route/Server Action):** Endpoint/Action to handle new idea creation.
    - [x] Link `submitter_user_id` to the logged-in user.
    - [x] Add submitter to `idea_members` table with 'Originator' role.
- [x] **Idea Viewing & Details:**
  - [x] **Frontend:** Create Idea detail page (`/ideas/[ideaId]`).
  - [x] **Frontend:** Display idea title, description, status, 'Looking For' tags.
  - [x] **Frontend:** Display list of team members (with links to their profiles).
  - [x] **Frontend:** Display comment/update feed.
  - [x] **Frontend:** Form to add new comments/updates.
  - [x] **Backend (API Route/Server Action):** Endpoint to fetch detailed idea data (including members, comments).
  - [x] **Backend (API Route/Server Action):** Endpoint/Action to add a comment (updates `last_activity_at`).
  - [x] **Frontend/Backend:** Logic for updating idea status and 'Looking For' tags (permissions for submitter/members).
  - [x] **Frontend/Backend:** Logic for adding/removing team members (permissions).
- [x] **People Directory:**
  - [x] **Frontend:** Create page (`/people`) to display users.
  - [x] **Frontend:** Implement List/Grid view component for user cards.
  - [x] **Frontend:** Implement filtering UI (by Skill, Status Tag, NS Month).
  - [x] **Backend (API Route/Server Action):** Endpoint to fetch users with filtering and pagination.
- [x] **Idea Hub:**
  - [x] **Frontend:** Create page (`/ideas`) to display ideas.
  - [x] **Frontend:** Implement List View component.
  - [x] **Frontend:** Implement Kanban View component (using state or a library).
  - [x] **Frontend:** Implement filtering/sorting UI (Status, Tags, Activity, etc.). Handle display of 'faded' inactive items. Filter out archived by default.
  - [x] **Backend (API Route/Server Action):** Endpoint to fetch ideas with filtering, sorting, and pagination. Include logic to determine 'inactive' status based on `last_activity_at`. Exclude archived unless requested.
  - [ ] (Optional V2) Implement Timeline View component.

## Phase 4: UI/UX & Styling

- [x] **Tailwind CSS Implementation:**
  - [x] Apply consistent styling across all components based on Tailwind defaults or a custom theme.
  - [x] Ensure responsive design for key pages (Profile, Ideas Hub, Idea Detail).
- [x] **Component Library:**
  - [x] Create reusable components (Buttons, Cards, Modals, Forms, Tags, Avatars).
- [x] **User Experience:**
  - [x] Ensure smooth navigation between pages.
  - [x] Provide clear visual feedback for actions (saving, loading, errors).
  - [x] Implement loading states for data fetching.
  - [x] Implement simple forms for profile editing and idea submission.

## Phase 5: Testing

- [ ] **Unit Tests:** Test utility functions, potentially complex components (optional).
- [ ] **Integration Tests:** Test API routes/Server Actions interaction with Supabase.
- [ ] **E2E Tests (Optional but Recommended):**
  - [ ] Test user flows (Sign up/in, profile update, idea submission, commenting, browsing). Use Cypress or Playwright.
- [x] **Manual Testing:** Thoroughly test all features across different browsers/devices. Test RLS policies.

## Phase 6: Deployment

- [x] **Environment Variables:**
  - [x] Configure production environment variables for Supabase URL/Key.
  - [x] Configure OAuth redirect URIs for production deployment URL.
- [x] **Platform Choice:** Choose hosting (Vercel/Netlify recommended).
- [x] **Deployment Process:**
  - [x] Set up Git-based deployment.
  - [x] Configure build settings.
- [x] **Custom Domain (Optional):** Configure DNS if using a custom domain.
- [x] **Supabase Production Checklist:** Review Supabase Go-Live checklist (DB backups, monitoring, etc.).

## Phase 7: Post-Launch & Maintenance

- [x] **Monitoring:** Set up basic logging and error tracking (Vercel Analytics, Sentry).
- [x] **Feedback:** Establish a channel for user feedback (e.g., a dedicated Discord channel, feedback form).
- [ ] **Bug Fixing:** Address issues reported by users.
- [ ] **Iteration:** Plan for V1.1 features based on feedback and the "Future Considerations" list.
- [ ] **Database Maintenance:** Monitor performance, consider indexing strategies as data grows. Ensure archiving logic is working.
