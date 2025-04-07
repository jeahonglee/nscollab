# PRD: Network School (NS) Connect Platform

**Version:** 1.1
**Date:** 2025-04-07
**Status:** Implemented

## 1. Introduction

**1.1. Goal:**
To create a dedicated web platform for Network School (NS) members to discover each other, share project ideas, form teams, and track ongoing initiatives within the community. The platform aims to enhance collaboration, preserve institutional knowledge across cohorts, and facilitate co-founder/team matching.

**1.2. Problem:**
NS attracts a diverse group of builders, founders, and non-technical individuals each month. While enthusiasm for collaboration is high, current methods (meetups, Discord channels) are inefficient for:
_ Persistently tracking who is currently active in NS.
_ Discovering members' skills, backgrounds, and interests.
_ Cataloging and tracking the status of project ideas.
_ Identifying existing projects or overlap with new ideas. \* Facilitating connections beyond initial introductions.
This leads to repetitive discovery efforts each month and missed opportunities for collaboration.

**1.3. Vision:**
A private, internal platform for NS members that serves as a dynamic directory of people and projects. It should be the go-to place to understand the NS landscape, find collaborators, showcase work, and track the lifecycle of ideas born within the community.

**1.4. Target Audience:**
Current and past members of Network School, including:
_ Aspiring founders looking for ideas or co-founders.
_ Builders (developers, designers, etc.) looking to join projects or showcase skills.
_ Individuals with ideas seeking team members.
_ Members simply wanting to network and understand the community's activities. \* Non-technical members looking to contribute specific expertise (marketing, ops, etc.).

## 2. Key Features

**2.1. User Authentication & Profiles**
_ **Authentication:**
_ Secure sign-in/sign-up using existing trusted providers: Google, Apple, Discord OAuth.
_ Leverage Supabase Auth for implementation.
_ Session management using secure cookies (as provided by `create-next-app -e with-supabase`).
_ **User Profile:**
_ **Basic Info:** Full Name, Profile Picture (upload or sync from auth provider).
_ **NS Presence:** Array of active months tracking NS participation (e.g., `["2024-07", "2024-08"]`).
_ **Contact/Social Links:** Input fields for Discord Username, X (Twitter), LinkedIn, GitHub, Instagram, Threads, YouTube.
_ **Custom Links:** Ability to add multiple custom URLs (Personal Website, Portfolio, Launched Product, Blog, etc.) with optional labels.
_ **Bio/About Me:** A brief section for users to introduce themselves.
_ **Skills & Expertise:** Tag-based field for skills (e.g., "React", "UI/UX Design", "Marketing", "Go-to-Market Strategy", "Python", "Solidity").
_ **Status Tags:** Pre-defined, selectable tags indicating user status/intent:
_ `Has Full-Time Job`
_ `Solo Founder (Stealth)`
_ `Solo Founder (Launched)`
_ `Has Team/Co-founders`
_ `Looking to Join Project`
_ `Looking for Co-founder(s)`
_ `Looking for Teammates`
_ `Hiring`
_ `Open to Networking`
_ `Building for Fun`
_ `Building for Hackathon`
_ **nspals.com Integration:** Auto-generate and display a link to `nspals.com/[discordusername]` if Discord username is provided.
_ **Privacy:** All profile information is accessible \_only_ to authenticated NS members logged into the platform. Not publicly searchable. \* **Ease of Setup:** Streamlined profile creation process upon first login.

**2.2. Idea Management**
_ **Idea Submission:**
_ Simple form to submit an idea.
_ Required fields: Name/Title, Description.
_ Submitter automatically linked as the 'Originator'.
_ **Idea Details:**
_ Each idea has a dedicated page displaying: Title, Description, Originator.
_ **Team Members:** List of users working on the idea (including Originator by default). Ability for Originator/members to add/remove other users.
_ **Idea Status:** Selectable status tags:
_ `Ideation`
_ `Planning`
_ `Building (MVP)`
_ `Launched`
_ `Actively Recruiting`
_ `Seeking Feedback`
_ `Paused / On Hold`
_ `Archived`
_ **Looking For:** Specific tags indicating needs (e.g., `Need Frontend Dev`, `Need Designer`, `Need Marketer`, `Need Co-founder`).
_ **Activity & Updates (Comment System):**
_ A comment/update feed associated with each idea.
_ Any authenticated user can post a comment, question, or update on an idea.
_ Posting a comment updates the idea's `last_activity_at` timestamp.
_ Displays timestamp for each comment and the user who posted it.
_ **Idea Lifecycle & Archiving:**
_ Ideas are considered 'active' if they have recent updates (comments).
_ Visual cue (e.g., slightly faded appearance in lists) if no updates for > 1 week.
_ Manual archiving through status change to `Archived`. Archived ideas are still viewable but filtered out by default in main views.

**2.3. Discovery & Browsing**
_ **People Directory:**
_ Browseable list/grid of all NS members on the platform.
_ Search/Filter by: Name, Skills, Status Tags, NS Participation Month(s).
_ **Idea Hub:**
_ Browseable views for all submitted ideas.
_ **List View:** Simple sortable list (by creation date, last activity).
_ **Kanban View:** Columns based on Idea Status (Ideation, Building, Launched, etc.).
_ **Filtering/Sorting:** Filter ideas by Status, 'Looking For' tags, Originator, Members, NS Month(s) of Originator/Members. Sort by Creation Date, Last Activity Date.
\_ **Search:** Search ideas by keywords in Title or Description.

**2.4. Privacy & Access Control**
_ The entire platform is private and requires authentication.
_ User profiles and idea details are not indexed by search engines. \* Access restricted to users authenticated via approved methods (Google, Apple, Discord associated with NS).

## 3. Non-Functional Requirements

    *   **Usability:** Intuitive interface, minimal clicks to create profile and submit ideas. Easy navigation.
    *   **Performance:** Fast load times, responsive UI, efficient database queries (especially for filtering/searching).
    *   **Scalability:** Architecture handles hundreds or potentially thousands of users and ideas over time (Supabase handles DB scaling well).
    *   **Security:** Standard web security practices, secure handling of authentication tokens, protection against common vulnerabilities. Data privacy enforced via database policies (RLS).
    *   **Maintainability:** Clean, well-documented code (TypeScript), logical project structure.

## 4. Design & UX Considerations

    *   Clean, modern aesthetic using Tailwind CSS.
    *   Responsive design for usability on desktop and mobile devices.
    *   Clear visual distinction between active and inactive/archived ideas.
    *   Emphasis on profile completeness prompts (optional).

## 5. Technology Stack

    *   **Frontend:** Next.js 15 (App Router)
    *   **Backend/Database:** Supabase (PostgreSQL, Auth, Storage)
    *   **Language:** TypeScript
    *   **Styling:** Tailwind CSS with shadcn/ui components
    *   **Deployment:** Vercel

## 6. Future Considerations (Post-MVP)

    *   Direct messaging between users within the platform.
    *   Notification system (e.g., when someone comments on your idea, when a user with desired skills joins).
    *   More advanced matching algorithms (suggesting potential co-founders based on skills/interests).
    *   Integration with Discord bots for notifications or idea submission.
    *   Admin panel for managing users and content.
    *   Dedicated sections for past cohorts' archived projects.
    *   Skill endorsement feature.
    *   Timeline View in Idea Hub for visual representation of ideas based on creation date or activity.
    *   Automatic archiving of inactive ideas using Supabase Edge Functions.

## 7. Success Metrics

    *   User adoption rate (% of NS members creating profiles).
    *   Profile completion rate.
    *   Number of ideas submitted per cohort/month.
    *   Number of users joining project teams via the platform.
    *   User engagement (frequency of logins, comments, updates).
    *   Qualitative feedback from NS members.

## 8. Implementation Progress

    *   **✅ Phase 1:** Setup & Authentication - Complete
    *   **✅ Phase 2:** Database Schema (Supabase) - Complete
    *   **✅ Phase 3:** Core Feature Implementation - Complete
    *   **✅ Phase 4:** UI/UX & Styling - Complete
    *   **🟠 Phase 5:** Testing - Partial (Manual testing complete, automated tests pending)
    *   **✅ Phase 6:** Deployment - Complete
    *   **🟠 Phase 7:** Post-Launch & Maintenance - In Progress

For detailed implementation status, refer to [DEV-CHECKLIST.md](./DEV-CHECKLIST.md).
