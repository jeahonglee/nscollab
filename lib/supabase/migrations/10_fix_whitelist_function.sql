-- Drop the existing function that has the ambiguous column reference issue
DROP FUNCTION IF EXISTS public.is_discord_username_whitelisted(text);

-- Recreate the function with a non-ambiguous parameter name
CREATE OR REPLACE FUNCTION public.is_discord_username_whitelisted(input_username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.discord_whitelist WHERE lower(discord_whitelist.username) = lower(input_username)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
