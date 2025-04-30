-- Consolidated Migration: 03_demoday_functions.sql
-- Description: All demoday-related functions including the fixed calculation function

-- 1. Function to start demoday pitching phase
CREATE OR REPLACE FUNCTION start_demoday_pitching(p_demoday_id uuid) 
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  demoday_exists boolean;
BEGIN
  -- Check if demoday exists
  SELECT EXISTS(SELECT 1 FROM public.demodays WHERE id = p_demoday_id) INTO demoday_exists;
  
  IF NOT demoday_exists THEN
    RAISE EXCEPTION 'Demoday with ID % does not exist', p_demoday_id;
  END IF;
  
  -- Update status and set active
  UPDATE public.demodays
  SET status = 'pitching', is_active = true
  WHERE id = p_demoday_id;
  
  -- Note: We no longer automatically initialize balances for all users
  -- Users must register as angel investors during the pitching phase
  
  RETURN true;
END;
$$;

-- 2. Function to register as angel investor
CREATE OR REPLACE FUNCTION register_as_angel(p_demoday_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  demoday_active boolean;
BEGIN
  -- Check if demoday is in pitching phase
  SELECT EXISTS(
    SELECT 1 FROM public.demodays 
    WHERE id = p_demoday_id AND status = 'pitching'
  ) INTO demoday_active;
  
  IF NOT demoday_active THEN
    RAISE EXCEPTION 'Demoday is not currently in pitching phase';
  END IF;
  
  -- Register user as angel investor with initial balance
  INSERT INTO public.user_balances (demoday_id, user_id, initial_balance, remaining_balance, is_angel)
  VALUES (p_demoday_id, p_user_id, 1000000, 1000000, true)
  ON CONFLICT (demoday_id, user_id) 
  DO UPDATE SET 
    is_angel = true,
    initial_balance = 1000000,
    remaining_balance = 1000000,
    updated_at = now();
  
  RETURN true;
END;
$$;

-- 3. Function to invest in a pitch
CREATE OR REPLACE FUNCTION invest_in_pitch(p_demoday_id uuid, p_investor_id uuid, p_pitch_id uuid, p_amount numeric)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  demoday_active boolean;
  is_registered_angel boolean;
  current_balance numeric;
BEGIN
  -- Check if demoday is in pitching phase
  SELECT EXISTS(
    SELECT 1 FROM public.demodays 
    WHERE id = p_demoday_id AND status = 'pitching'
  ) INTO demoday_active;
  
  IF NOT demoday_active THEN
    RAISE EXCEPTION 'Demoday is not currently in pitching phase';
  END IF;
  
  -- Check if user is registered as an angel
  SELECT EXISTS(
    SELECT 1 FROM public.user_balances
    WHERE demoday_id = p_demoday_id AND user_id = p_investor_id AND is_angel = true
  ) INTO is_registered_angel;
  
  IF NOT is_registered_angel THEN
    RAISE EXCEPTION 'User is not registered as an angel investor for this demoday';
  END IF;
  
  -- Check if user has enough balance
  SELECT remaining_balance INTO current_balance
  FROM public.user_balances
  WHERE demoday_id = p_demoday_id AND user_id = p_investor_id;
  
  IF current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance (% available)', current_balance;
  END IF;
  
  -- Create or update investment
  INSERT INTO public.demoday_investments (demoday_id, investor_id, pitch_id, amount)
  VALUES (p_demoday_id, p_investor_id, p_pitch_id, p_amount)
  ON CONFLICT (demoday_id, investor_id, pitch_id) 
  DO UPDATE SET amount = p_amount;
  
  -- Update user balance
  UPDATE public.user_balances
  SET remaining_balance = remaining_balance - p_amount,
      updated_at = now()
  WHERE demoday_id = p_demoday_id AND user_id = p_investor_id;
  
  RETURN true;
END;
$$;

-- 4. Debug-enhanced function to calculate final results
CREATE OR REPLACE FUNCTION calculate_demoday_results(p_demoday_id uuid) 
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Simply use our proven emergency function that handles all edge cases
  PERFORM emergency_calculate_demoday(p_demoday_id);
  RETURN true;
END;
$$;

-- 5. Alternative calculation function that bypasses RLS
CREATE OR REPLACE FUNCTION force_calculate_demoday_results(p_demoday_id uuid) 
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Use our guaranteed results function
  PERFORM emergency_calculate_demoday(p_demoday_id);
  RETURN true;
END;
$$;

-- 6. Bulletproof calculation function with explicit SQL
CREATE OR REPLACE FUNCTION emergency_calculate_demoday(p_demoday_id uuid) 
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pitch_rankings jsonb;
  v_investor_rankings jsonb;
  v_results jsonb;
  v_multipliers numeric[] := ARRAY[20.0, 10.0, 5.0, 3.0, 2.0];
BEGIN
  -- Clear existing results
  DELETE FROM public.demoday_results 
  WHERE demoday_id = p_demoday_id;
  
  -- Mark demoday as completed
  UPDATE public.demodays 
  SET status = 'completed', is_active = false
  WHERE id = p_demoday_id;
  
  -- Step 1: Create a temporary table for pitch funding totals
  DROP TABLE IF EXISTS temp_pitch_funding;
  CREATE TEMP TABLE temp_pitch_funding AS
  SELECT 
    dp.id AS pitch_id,
    dp.idea_id,
    i.title AS idea_title,
    p.id AS pitcher_id,
    p.full_name AS pitcher_name,
    p.avatar_url AS pitcher_avatar,
    p.discord_username AS pitcher_username,
    COALESCE(SUM(di.amount), 0) AS total_funding
  FROM public.demoday_pitches dp
  JOIN public.ideas i ON dp.idea_id = i.id
  JOIN public.profiles p ON dp.pitcher_id = p.id
  LEFT JOIN public.demoday_investments di ON dp.id = di.pitch_id AND di.demoday_id = p_demoday_id
  WHERE dp.demoday_id = p_demoday_id
  GROUP BY dp.id, dp.idea_id, i.title, p.id, p.full_name, p.avatar_url, p.discord_username;
  
  -- Step 2: Create a temp table with ranks
  DROP TABLE IF EXISTS temp_pitch_rankings;
  CREATE TEMP TABLE temp_pitch_rankings AS
  SELECT 
    DENSE_RANK() OVER (ORDER BY total_funding DESC) AS rank,
    pitch_id,
    idea_id,
    idea_title,
    pitcher_id,
    pitcher_name,
    pitcher_avatar,
    pitcher_username,
    total_funding
  FROM temp_pitch_funding
  WHERE total_funding > 0;
  
  -- Step 3: Calculate investor returns for top 5 pitches
  DROP TABLE IF EXISTS temp_investor_returns;
  CREATE TEMP TABLE temp_investor_returns AS
  SELECT 
    di.investor_id,
    SUM(di.amount) AS total_invested,
    SUM(
      CASE 
        WHEN pr.rank = 1 THEN di.amount * v_multipliers[1]
        WHEN pr.rank = 2 THEN di.amount * v_multipliers[2]
        WHEN pr.rank = 3 THEN di.amount * v_multipliers[3]
        WHEN pr.rank = 4 THEN di.amount * v_multipliers[4]
        WHEN pr.rank = 5 THEN di.amount * v_multipliers[5]
        ELSE di.amount
      END
    ) AS total_returns
  FROM public.demoday_investments di
  JOIN temp_pitch_rankings pr ON di.pitch_id = pr.pitch_id
  WHERE di.demoday_id = p_demoday_id
  GROUP BY di.investor_id;
  
  -- Step 4: Create final investor rankings
  DROP TABLE IF EXISTS temp_investor_rankings;
  CREATE TEMP TABLE temp_investor_rankings AS
  SELECT 
    DENSE_RANK() OVER (ORDER BY (ub.remaining_balance + COALESCE(ir.total_returns, 0)) DESC) AS rank,
    ub.user_id AS investor_id,
    p.full_name AS investor_name,
    p.avatar_url AS investor_avatar,
    p.discord_username AS investor_username,
    ub.initial_balance,
    (ub.initial_balance - ub.remaining_balance) AS invested_amount,
    COALESCE(ir.total_returns, 0) AS returns,
    ub.remaining_balance + COALESCE(ir.total_returns, 0) AS final_balance
  FROM public.user_balances ub
  JOIN public.profiles p ON ub.user_id = p.id
  LEFT JOIN temp_investor_returns ir ON ub.user_id = ir.investor_id
  WHERE ub.demoday_id = p_demoday_id AND ub.is_angel = true;
  
  -- Update user balances with final balance
  UPDATE public.user_balances ub
  SET final_balance = ir.final_balance
  FROM temp_investor_rankings ir
  WHERE ub.demoday_id = p_demoday_id AND ub.user_id = ir.investor_id;

  -- Convert to JSON arrays
  SELECT jsonb_agg(to_jsonb(pr)) INTO v_pitch_rankings FROM temp_pitch_rankings pr;
  SELECT jsonb_agg(to_jsonb(ir)) INTO v_investor_rankings FROM temp_investor_rankings ir;
  
  -- Handle NULL arrays
  IF v_pitch_rankings IS NULL THEN
    v_pitch_rankings := '[]'::jsonb;
  END IF;
  
  IF v_investor_rankings IS NULL THEN
    v_investor_rankings := '[]'::jsonb;
  END IF;
  
  -- Insert results
  INSERT INTO public.demoday_results(demoday_id, pitch_rankings, investor_rankings)
  VALUES (p_demoday_id, v_pitch_rankings, v_investor_rankings);
  
  -- Return the results
  SELECT jsonb_build_object(
    'pitch_rankings_count', jsonb_array_length(v_pitch_rankings),
    'investor_rankings_count', jsonb_array_length(v_investor_rankings),
    'pitch_rankings', v_pitch_rankings,
    'investor_rankings', v_investor_rankings
  ) INTO v_results;
  
  RETURN v_results;
END;
$$;

-- 7. Test data helper function
CREATE OR REPLACE FUNCTION create_test_demoday_data(p_demoday_id uuid, p_user_id uuid) 
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pitch_id uuid;
BEGIN
  -- 1. Register user as angel investor if not already
  INSERT INTO public.user_balances (demoday_id, user_id, initial_balance, remaining_balance, is_angel)
  VALUES (p_demoday_id, p_user_id, 1000000, 800000, true)
  ON CONFLICT (demoday_id, user_id) 
  DO UPDATE SET 
    is_angel = true,
    initial_balance = 1000000,
    remaining_balance = 800000,
    updated_at = now();
  
  -- 2. Get the first pitch (if any) to simulate an investment
  SELECT id INTO v_pitch_id FROM public.demoday_pitches WHERE demoday_id = p_demoday_id LIMIT 1;
  
  -- 3. Create a test investment if a pitch exists
  IF v_pitch_id IS NOT NULL THEN
    INSERT INTO public.demoday_investments (demoday_id, investor_id, pitch_id, amount)
    VALUES (p_demoday_id, p_user_id, v_pitch_id, 200000)
    ON CONFLICT (demoday_id, investor_id, pitch_id) 
    DO UPDATE SET amount = 200000;
  END IF;
  
  RETURN true;
END;
$$;

-- 8. Function to clear test data
CREATE OR REPLACE FUNCTION clear_demoday_data(p_demoday_id uuid) 
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Clean all data for this demoday
  DELETE FROM public.demoday_investments WHERE demoday_id = p_demoday_id;
  DELETE FROM public.user_balances WHERE demoday_id = p_demoday_id;
  DELETE FROM public.demoday_results WHERE demoday_id = p_demoday_id;
  
  RETURN true;
END;
$$;

-- 9. Diagnostic function to help debug calculation issues
CREATE OR REPLACE FUNCTION get_demoday_diagnostics(p_demoday_id uuid) 
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_diagnostics jsonb;
BEGIN
  WITH funding_summary AS (
    SELECT 
      dp.id AS pitch_id,
      dp.idea_id,
      i.title AS idea_title,
      COALESCE(SUM(di.amount), 0) AS total_funding,
      COUNT(di.id) AS investment_count
    FROM public.demoday_pitches dp
    JOIN public.ideas i ON dp.idea_id = i.id
    LEFT JOIN public.demoday_investments di ON dp.id = di.pitch_id AND di.demoday_id = p_demoday_id
    WHERE dp.demoday_id = p_demoday_id
    GROUP BY dp.id, dp.idea_id, i.title
  )
  SELECT jsonb_build_object(
    'demoday_id', p_demoday_id,
    'demoday_info', (
      SELECT jsonb_build_object(
        'status', status,
        'is_active', is_active,
        'event_date', event_date
      ) FROM public.demodays WHERE id = p_demoday_id
    ),
    'results_exist', (SELECT EXISTS(SELECT 1 FROM public.demoday_results WHERE demoday_id = p_demoday_id)),
    'result_content', (SELECT jsonb_build_object(
      'pitch_count', jsonb_array_length(pitch_rankings),
      'investor_count', jsonb_array_length(investor_rankings)
    ) FROM public.demoday_results WHERE demoday_id = p_demoday_id),
    'pitch_count', (SELECT COUNT(*) FROM public.demoday_pitches WHERE demoday_id = p_demoday_id),
    'investment_count', (SELECT COUNT(*) FROM public.demoday_investments WHERE demoday_id = p_demoday_id),
    'angel_count', (SELECT COUNT(*) FROM public.user_balances WHERE demoday_id = p_demoday_id AND is_angel = true),
    'funding_summary', (SELECT jsonb_agg(to_jsonb(fs)) FROM funding_summary fs),
    'timestamp', now()
  ) INTO v_diagnostics;
  
  RETURN v_diagnostics;
END;
$$;

-- 10. Grant execution permissions for all functions
GRANT EXECUTE ON FUNCTION start_demoday_pitching(uuid) TO postgres, authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION register_as_angel(uuid, uuid) TO postgres, authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION invest_in_pitch(uuid, uuid, uuid, numeric) TO postgres, authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION calculate_demoday_results(uuid) TO postgres, authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION force_calculate_demoday_results(uuid) TO postgres, authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION emergency_calculate_demoday(uuid) TO postgres, authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION create_test_demoday_data(uuid, uuid) TO postgres, authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION clear_demoday_data(uuid) TO postgres, authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION get_demoday_diagnostics(uuid) TO postgres, authenticated, anon, service_role; 