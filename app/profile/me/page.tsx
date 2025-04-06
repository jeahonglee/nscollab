import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import ProfileForm from '@/components/profile/profile-form';
import { ProfileWithRelations } from '@/lib/supabase/types';

export default async function ProfilePage() {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/sign-in');
  }
  
  // Fetch user profile with all fields
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  // Fetch NS stays for this user
  const { data: nsStays } = await supabase
    .from('ns_stays')
    .select('*')
    .eq('user_id', user.id)
    .order('start_month', { ascending: false });
  
  // If profile doesn't exist yet, create a minimal one from Discord metadata
  if (!profile) {
    // Get Discord username from user metadata
    const discordUsername = user.user_metadata?.preferred_username || user.user_metadata?.user_name;
    const avatarUrl = user.user_metadata?.avatar_url;
    
    if (discordUsername) {
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          full_name: user.user_metadata.full_name || '',
          avatar_url: avatarUrl || '',
          discord_username: discordUsername
        });
      
      if (error) {
        console.error('Error creating profile:', error);
      } else {
        // Refresh the page after creating the profile
        redirect('/profile/me');
      }
    }
  }
  
  // Fetch NS stays for this user

  const profileWithStays: ProfileWithRelations = {
    ...profile!,
    ns_stays: nsStays || [],
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>
      <p className="text-muted-foreground mb-8">
        Update your profile information and Network School participation history.
      </p>
      <ProfileForm user={user} profile={profileWithStays} />
    </div>
  );
}
