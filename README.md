<a href="https://nscollab.com">
  <h1 align="center">NS Collab Platform</h1>
</a>

<p align="center">
 A private platform for Network School (NS) members to connect, share ideas, form teams, and track projects.
</p>

<p align="center">
  <a href="#overview"><strong>Overview</strong></a> ·
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#technology-stack"><strong>Technology Stack</strong></a> ·
  <a href="#setup-and-run-locally"><strong>Setup and Run Locally</strong></a> ·
  <a href="#documentation"><strong>Documentation</strong></a>
</p>
<br/>

## Overview

NS Collab Platform aims to solve the challenge of persistent connection and collaboration within the Network School community. Current methods like meetups and Discord are ephemeral. This platform provides a dedicated space to:

- Discover fellow NS members, their skills, and interests.
- Catalog, track, and collaborate on project ideas.
- Prevent redundant discovery efforts each cohort.
- Facilitate meaningful connections and team formation.
- Preserve institutional knowledge across NS cohorts.

The platform is intended for **internal use by NS members only**.

## Features

Based on the [Product Requirements Document (PRD)](./docs/PRD.md), key features include:

- **Secure Authentication:** Sign-in via Google, Apple, Discord using Supabase Auth.
- **Detailed User Profiles:** Showcase skills, background, NS participation history, social links, project interests, and availability status (e.g., `Looking for Co-founder`, `Building for Fun`). Includes auto-generated `nspals.com` link.
- **Idea Management:**
  - Submit project ideas with descriptions.
  - Track idea status (Ideation, Building, Launched, etc.).
  - Form teams around ideas.
  - Specify needs (e.g., `Need Designer`, `Need Frontend Dev`).
  - Comment/update feed for ongoing discussion and activity tracking.
- **Discovery:**
  - **Members Directory:** Searchable and filterable member list.
  - **Idea Hub:** Browseable ideas via List, Kanban views with filtering/sorting.
- **Privacy:** Platform access restricted to authenticated NS members.

_(Refer to `docs/PRD.md` for full feature details)_

## Technology Stack

- **Framework:** [Next.js](https://nextjs.org/) 15 (App Router)
- **Backend & Database:** [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
- **Deployment:** Targetting [Vercel](https://vercel.com/)

## Setup and Run Locally

This project was initialized using the `create-next-app` template with Supabase integration (`--example with-supabase`).

1.  **Prerequisites:**

    - Node.js (Version recommended by Next.js 15)
    - npm, yarn, or pnpm
    - A [Supabase account and project](https://database.new).

2.  **Clone the repository:**

    ```bash
    git clone <your-repo-url>
    cd <your-repo-directory> # e.g., cd ns-collab
    ```

3.  **Install dependencies:**

    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

4.  **Configure Environment Variables:**

    - Rename `.env.example` to `.env.local`.
    - Update the file with your Supabase project details:

      ```dotenv
      NEXT_PUBLIC_SUPABASE_URL=[INSERT SUPABASE PROJECT URL]
      NEXT_PUBLIC_SUPABASE_ANON_KEY=[INSERT SUPABASE PROJECT API ANON KEY]

      # You will also need Client IDs and Secrets for your chosen OAuth providers
      # Add them here as needed, e.g.:
      # DISCORD_CLIENT_ID=...
      # DISCORD_CLIENT_SECRET=...
      ```

    - Find `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in your [Supabase project's API settings](https://app.supabase.com/project/_/settings/api).
    - **Important:** Ensure you configure the necessary OAuth providers (Google, Apple, Discord) within your Supabase project's Authentication settings, including setting up the correct Redirect URIs (e.g., `http://localhost:3000/auth/callback` for local development).

5.  **Set up Supabase Database:**

    - Apply the necessary database schema. You can use the SQL definitions potentially found in `supabase/migrations` (if using Supabase CLI) or define them manually via the Supabase dashboard. Refer to the schema defined in `docs/DEV-CHECKLIST.md` (Phase 2).
    - **Crucially, set up Row Level Security (RLS) policies** as outlined in the `DEV-CHECKLIST.md` to ensure data privacy and proper access control.

6.  **Run the development server:**

    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    ```

    The application should now be running on [http://localhost:3000](http://localhost:3000/).

7.  **(Optional) Shadcn/UI Styles:**
    - This template comes with the default `shadcn/ui` style. If you want a different theme, delete `components.json` and re-initialize `shadcn/ui` following their [documentation](https://ui.shadcn.com/docs/installation/next).

## Documentation

- **[Product Requirements (PRD)](./docs/PRD.md):** Detailed overview of the project's goals, features, and specifications.
- **[Development Checklist](./docs/DEV-CHECKLIST.md):** Tracks the development progress and outlines technical implementation steps (including database schema and RLS). **Please update this checklist manually** to reflect the current state of completed tasks.
- **[Setup Guide](./docs/SETUP-GUIDE.md):** Technical guide for setting up the project for development or deployment, including database schema SQL and RLS policies.

## Feedback and Issues

Please file feedback and issues specific to the NS Collab Platform within this repository's issue tracker. For issues related to the underlying Supabase integration or Next.js, refer to their respective official channels.
