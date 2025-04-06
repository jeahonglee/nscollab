-- Remove unused fields from tables
-- Removing 'background' from profiles and 'end_month' from ns_stays

-- Remove background column from profiles table
ALTER TABLE IF EXISTS "profiles" DROP COLUMN IF EXISTS "background";

-- Remove end_month column from ns_stays table
ALTER TABLE IF EXISTS "ns_stays" DROP COLUMN IF EXISTS "end_month";
