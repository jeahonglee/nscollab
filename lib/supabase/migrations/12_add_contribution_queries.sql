-- 12_add_contribution_queries.sql
-- Run these queries in Supabase SQL Editor to fetch daily comment counts for users or ideas over the last year

-- Query 1: Daily comment counts for a specific user
-- Replace $1 with the user_id (UUID)
SELECT
  DATE(created_at)   AS date,
  COUNT(*)            AS count
FROM idea_comments
WHERE user_id = $1
  AND created_at >= date_trunc('day', now() - interval '1 year')
GROUP BY DATE(created_at)
ORDER BY date;

-- Query 2: Daily comment counts for a specific idea
-- Replace $1 with the idea_id (UUID)
SELECT
  DATE(created_at)   AS date,
  COUNT(*)            AS count
FROM idea_comments
WHERE idea_id = $1
  AND created_at >= date_trunc('day', now() - interval '1 year')
GROUP BY DATE(created_at)
ORDER BY date;
