-- Migration: 11_add_demoday_tables.sql
-- Description: Adds tables for Demoday events and pitch submissions.

-- Create demodays table to store information about each event
create table public.demodays (
  id uuid primary key default gen_random_uuid(),
  event_date date not null unique, -- Represents the 1st of the month of the demoday
  created_at timestamptz default now() not null
);

-- Add comments to demodays table
comment on table public.demodays is 'Stores information about each monthly Demoday event.';
comment on column public.demodays.event_date is 'Represents the 1st of the month for the Demoday event (e.g., 2025-05-01 for May 2025). Used as the identifier.';

-- Enable RLS for demodays table
alter table public.demodays enable row level security;

-- Policies for demodays table
-- Allow authenticated users to read all demoday events
create policy "Allow authenticated users to read demodays"
on public.demodays
for select
using (auth.role() = 'authenticated');

-- Create demoday_pitches table to link ideas to demodays
create table public.demoday_pitches (
  id uuid primary key default gen_random_uuid(),
  demoday_id uuid not null references public.demodays(id) on delete cascade,
  idea_id uuid not null references public.ideas(id) on delete cascade,
  pitcher_id uuid not null references public.profiles(id) on delete cascade,
  submitted_at timestamptz default now() not null,
  created_at timestamptz default now() not null
);

-- Add indexes for frequent lookups
create index idx_demoday_pitches_demoday_id on public.demoday_pitches(demoday_id);
create index idx_demoday_pitches_pitcher_id on public.demoday_pitches(pitcher_id);
create index idx_demoday_pitches_idea_id on public.demoday_pitches(idea_id);
create index idx_demoday_pitches_submitted_at on public.demoday_pitches(submitted_at); -- For ordering

-- Add unique constraint: one pitch per user per demoday
alter table public.demoday_pitches
add constraint unique_pitcher_per_demoday unique (demoday_id, pitcher_id);

-- Add comments to demoday_pitches table
comment on table public.demoday_pitches is 'Stores the ideas submitted to pitch for each Demoday, ordered by submission time.';
comment on column public.demoday_pitches.demoday_id is 'FK to the specific Demoday event.';
comment on column public.demoday_pitches.idea_id is 'FK to the idea being pitched.';
comment on column public.demoday_pitches.pitcher_id is 'FK to the profile of the user submitting the pitch.';
comment on column public.demoday_pitches.submitted_at is 'Timestamp when the pitch was submitted, used for ordering.';

-- Enable RLS for demoday_pitches table
alter table public.demoday_pitches enable row level security;

-- Policies for demoday_pitches table
-- Allow authenticated users to read all pitches
create policy "Allow authenticated users to read pitches"
on public.demoday_pitches
for select
using (auth.role() = 'authenticated');

-- Allow authenticated users to insert a pitch only for themselves
create policy "Allow users to insert their own pitch"
on public.demoday_pitches
for insert
with check (auth.uid() = pitcher_id);

-- Allow users to delete their own pitch
create policy "Allow users to delete their own pitch"
on public.demoday_pitches
for delete
using (auth.uid() = pitcher_id);

-- Add policy to allow authenticated users to insert into demodays
create policy "Allow authenticated users to insert demodays"
on public.demodays
for insert
to authenticated -- Grant insert permission to logged-in users
with check (true); -- No specific check condition needed for insert itself