import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { PostgrestError } from '@supabase/supabase-js';

export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the SSR package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;
  const redirectTo = requestUrl.searchParams.get('redirect_to')?.toString();

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (data?.user && !error) {
      // Get user ID from auth
      const userId = data.user.id;
      // Get user metadata from Discord OAuth
      // Try all possible places Discord might store the username
      const rawDiscordUsername =
        data.user.user_metadata?.preferred_username ||
        data.user.user_metadata?.user_name ||
        data.user.user_metadata?.name ||
        data.user.user_metadata?.full_name ||
        data.user.user_metadata?.username;

      // Clean the Discord username by removing the discriminator (e.g., #0, #1234)
      const discordUsername = rawDiscordUsername
        ? rawDiscordUsername.split('#')[0]
        : null;

      // Extract global_name from custom_claims for full_name (if available)
      const globalName =
        data.user.user_metadata?.custom_claims?.global_name || null;

      // Get email address
      const email = data.user.email || data.user.user_metadata?.email || null;

      const avatarUrl = data.user.user_metadata?.avatar_url;

      // Check if the Discord username is in the whitelist
      if (discordUsername) {
        const { data: whitelistData, error: whitelistError } = await supabase
          .rpc('is_discord_username_whitelisted', { username: discordUsername });

        if (whitelistError) {
          console.error('Error checking whitelist:', whitelistError);
          // If there's an error checking the whitelist, redirect to not-whitelisted page
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin;
          return NextResponse.redirect(`${siteUrl}/not-whitelisted`);
        }

        // If username is not in whitelist, redirect to not-whitelisted page
        if (!whitelistData) {
          console.log(`User ${discordUsername} not in whitelist, redirecting`);
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin;
          return NextResponse.redirect(`${siteUrl}/not-whitelisted`);
        }
      } else {
        // If no username was extracted, redirect to not-whitelisted page
        console.log('No Discord username found, redirecting');
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin;
        return NextResponse.redirect(`${siteUrl}/not-whitelisted`);
      }

      // Always try to create/update profile, even if username appears empty
      try {
        // Check if profile exists
        const { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          // PGRST116 = not found
          console.error('Error fetching profile:', fetchError);
        }

        let dbResult: { error: PostgrestError | null } = { error: null };

        // Update or create profile with Discord data
        if (existingProfile) {
          // Update existing profile
          dbResult = await supabase
            .from('profiles')
            .update({
              discord_username: discordUsername,
              full_name: globalName,
              email: email,
              avatar_url: avatarUrl,
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);
        } else {
          // Create new profile
          dbResult = await supabase.from('profiles').insert({
            id: userId,
            discord_username: discordUsername,
            full_name: globalName,
            email: email,
            avatar_url: avatarUrl,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }

        if (dbResult.error) {
          console.error('Error creating/updating profile:', dbResult.error);
        }
      } catch (err) {
        console.error('Unexpected error in profile creation/update:', err);
      }
    }
  }

  if (redirectTo) {
    return NextResponse.redirect(`${origin}${redirectTo}`);
  }

  // URL to redirect to after sign up process completes
  // Use NEXT_PUBLIC_SITE_URL for production or fall back to the request origin
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin;
  return NextResponse.redirect(`${siteUrl}/dashboard`);
}
