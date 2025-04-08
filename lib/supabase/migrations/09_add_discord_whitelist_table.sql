-- Create the discord_whitelist table
CREATE TABLE IF NOT EXISTS public.discord_whitelist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.discord_whitelist ENABLE ROW LEVEL SECURITY;

-- Create policy to allow only authenticated users to read the whitelist
CREATE POLICY "Allow authenticated users to read whitelist" ON public.discord_whitelist
    FOR SELECT
    TO authenticated
    USING (true);

-- Create policy to allow only service role to insert/update/delete
CREATE POLICY "Allow service role to manage whitelist" ON public.discord_whitelist
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create an index on username for faster lookups
CREATE INDEX idx_discord_whitelist_username ON public.discord_whitelist (username);

-- Create function to check if a username is whitelisted
CREATE OR REPLACE FUNCTION public.is_discord_username_whitelisted(input_username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.discord_whitelist WHERE lower(discord_whitelist.username) = lower(input_username)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
