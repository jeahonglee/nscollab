-- 13_add_contribution_functions.sql
-- Define SQL functions to fetch daily comment counts for users and ideas over the last year

-- Function: get_user_contributions
CREATE OR REPLACE FUNCTION public.get_user_contributions(userid uuid)
RETURNS TABLE(date date, count bigint) AS $$
  SELECT
    DATE(created_at) AS date,
    COUNT(*)        AS count
  FROM idea_comments
  WHERE user_id = userid
    AND created_at >= date_trunc('day', now() - interval '1 year')
  GROUP BY DATE(created_at)
  ORDER BY date;
$$ LANGUAGE sql STABLE;

-- Function: get_idea_contributions
CREATE OR REPLACE FUNCTION public.get_idea_contributions(ideaid uuid)
RETURNS TABLE(date date, count bigint) AS $$
  SELECT
    DATE(created_at) AS date,
    COUNT(*)        AS count
  FROM idea_comments
  WHERE idea_id = ideaid
    AND created_at >= date_trunc('day', now() - interval '1 year')
  GROUP BY DATE(created_at)
  ORDER BY date;
$$ LANGUAGE sql STABLE;

-- Usage examples:
-- SELECT * FROM public.get_user_contributions('YOUR_USER_UUID');
-- SELECT * FROM public.get_idea_contributions('YOUR_IDEA_UUID');
