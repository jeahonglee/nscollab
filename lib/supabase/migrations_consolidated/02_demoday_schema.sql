-- Consolidated Migration: 02_demoday_schema.sql
-- Description: Complete demoday schemas including funding, pitches, and results

-- 1. Create demodays table
CREATE TABLE public.demodays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_date DATE NOT NULL UNIQUE COMMENT 'Represents the 1st of the month for the Demoday event (e.g., 2025-05-01 for May 2025). Used as the identifier.',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  details JSONB DEFAULT jsonb_build_object(
    'when', null,
    'where', null,
    'what', null,
    'luma_url', null
  ) COMMENT 'Additional information about the demoday event (when, where, what, luma_url)',
  status TEXT NOT NULL DEFAULT 'upcoming' COMMENT 'Status of the demoday (upcoming, pitching, completed)',
  is_active BOOLEAN NOT NULL DEFAULT false COMMENT 'Whether the demoday is currently active (pitches are locked when true)',
  host_id UUID REFERENCES public.profiles(id) COMMENT 'The user who is hosting this demoday'
);

-- 2. Create demoday_pitches table
CREATE TABLE public.demoday_pitches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demoday_id UUID NOT NULL REFERENCES public.demodays(id) ON DELETE CASCADE COMMENT 'FK to the specific Demoday event.',
  idea_id UUID NOT NULL REFERENCES public.ideas(id) COMMENT 'FK to the idea being pitched.',
  pitcher_id UUID NOT NULL REFERENCES public.profiles(id) COMMENT 'FK to the profile of the user submitting the pitch.',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now() COMMENT 'Timestamp when the pitch was submitted, used for ordering.',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create demoday_investments table
CREATE TABLE public.demoday_investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demoday_id UUID NOT NULL REFERENCES public.demodays(id) ON DELETE CASCADE COMMENT 'FK to the demoday event',
  investor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE COMMENT 'FK to the profile of the user making the investment',
  pitch_id UUID NOT NULL REFERENCES public.demoday_pitches(id) ON DELETE CASCADE COMMENT 'FK to the pitch being invested in',
  amount NUMERIC NOT NULL CHECK (amount > 0) COMMENT 'Amount invested in the pitch (virtual currency)',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Each user can only invest once per pitch per demoday
  CONSTRAINT unique_investment_per_user_per_pitch UNIQUE (demoday_id, investor_id, pitch_id)
);

-- 4. Create demoday_results table
CREATE TABLE public.demoday_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demoday_id UUID NOT NULL REFERENCES public.demodays(id) ON DELETE CASCADE COMMENT 'FK to the demoday event',
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now() COMMENT 'When the results were calculated',
  pitch_rankings JSONB NOT NULL DEFAULT '[]'::jsonb COMMENT 'Ranked list of pitches with funding details',
  investor_rankings JSONB NOT NULL DEFAULT '[]'::jsonb COMMENT 'Ranked list of investors with final balances',
  
  CONSTRAINT unique_result_per_demoday UNIQUE (demoday_id)
);

-- 5. Create user_balances table
CREATE TABLE public.user_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demoday_id UUID NOT NULL REFERENCES public.demodays(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  initial_balance NUMERIC NOT NULL DEFAULT 1000000 COMMENT 'Initial virtual currency amount (default $1M)',
  remaining_balance NUMERIC NOT NULL DEFAULT 1000000 COMMENT 'Current remaining balance during funding',
  final_balance NUMERIC DEFAULT NULL COMMENT 'Final balance after results calculation',
  is_angel BOOLEAN NOT NULL DEFAULT false COMMENT 'Whether user has registered as an angel investor',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_balance_per_user_per_demoday UNIQUE (demoday_id, user_id)
);

-- 6. Add indexes for frequent queries
CREATE INDEX idx_demoday_investments_demoday_id ON public.demoday_investments(demoday_id);
CREATE INDEX idx_demoday_investments_investor_id ON public.demoday_investments(investor_id);
CREATE INDEX idx_demoday_investments_pitch_id ON public.demoday_investments(pitch_id);

-- 7. Enable Row Level Security on demoday tables
ALTER TABLE public.demodays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demoday_pitches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demoday_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demoday_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_balances ENABLE ROW LEVEL SECURITY;

-- 8. RLS policies for demodays
CREATE POLICY "Allow authenticated users to read demodays"
  ON public.demodays FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert demodays"
  ON public.demodays FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow host to update their demoday"
  ON public.demodays FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND
    (auth.uid() = host_id OR host_id IS NULL)
  );

-- 9. RLS policies for demoday_pitches
CREATE POLICY "Allow authenticated users to read pitches"
  ON public.demoday_pitches FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow users to insert their own pitch"
  ON public.demoday_pitches FOR INSERT
  WITH CHECK (auth.uid() = pitcher_id);

CREATE POLICY "Allow users to delete their own pitch when demoday not active"
  ON public.demoday_pitches FOR DELETE
  USING (
    auth.uid() = pitcher_id AND
    EXISTS (
      SELECT 1 FROM public.demodays d 
      WHERE d.id = demoday_id AND d.is_active = false
    )
  );

-- 10. RLS policies for demoday_investments
CREATE POLICY "Allow authenticated users to view investments during completed phase"
  ON public.demoday_investments FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.demodays d 
      WHERE d.id = demoday_id AND d.status = 'completed'
    )
  );

CREATE POLICY "Allow authenticated users to insert their own investments during pitching phase"
  ON public.demoday_investments FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    auth.uid() = investor_id AND
    EXISTS (
      SELECT 1 FROM public.demodays d 
      WHERE d.id = demoday_id AND d.status = 'pitching'
    ) AND
    EXISTS (
      SELECT 1 FROM public.user_balances ub
      WHERE ub.demoday_id = demoday_investments.demoday_id AND ub.user_id = auth.uid() AND ub.is_angel = true
    )
  );

CREATE POLICY "Allow service role to manage investments"
  ON public.demoday_investments
  USING (auth.role() = 'service_role');

-- 11. RLS policies for demoday_results
CREATE POLICY "Allow authenticated users to view results"
  ON public.demoday_results FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow service_role to insert results"
  ON public.demoday_results
  USING (auth.role() = 'service_role');

-- 12. RLS policies for user_balances
CREATE POLICY "Allow authenticated users to view balances"
  ON public.user_balances FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update their own balance"
  ON public.user_balances FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.demodays d 
      WHERE d.id = demoday_id AND d.status = 'pitching'
    ) AND 
    is_angel = true
  );

CREATE POLICY "Allow authenticated users to insert their own balance"
  ON public.user_balances FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.demodays d 
      WHERE d.id = demoday_id AND d.status = 'pitching'
    )
  );

-- 13. Grant proper permissions to roles
GRANT SELECT ON public.demodays TO postgres, authenticated, anon, service_role;
GRANT SELECT ON public.demoday_pitches TO postgres, authenticated, anon, service_role;
GRANT SELECT ON public.ideas TO postgres, authenticated, anon, service_role;
GRANT SELECT ON public.profiles TO postgres, authenticated, anon, service_role;
GRANT SELECT ON public.demoday_investments TO postgres, authenticated, anon, service_role;
GRANT SELECT ON public.user_balances TO postgres, authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.demoday_results TO postgres, authenticated, anon, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres, authenticated, anon, service_role; 