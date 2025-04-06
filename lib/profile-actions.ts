'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function updateProfile(formData: FormData, userId: string) {
  const supabase = await createClient();
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (!currentProfile) {
    throw new Error('Profile not found');
  }

  // Process the Bio field
  let bioText = '';

  if (formData.has('bio')) {
    const bioTextInput = formData.get('bio') as string | null;
    if (bioTextInput) {
      // Use the entire text as bio
      bioText = bioTextInput.trim();
    }
  }

  // Create an update object with only the fields that are present in the form
  const updateData: Record<string, any> = {
    // Only update these if they're in the form
    full_name: formData.has('fullName')
      ? (formData.get('fullName') as string)
      : currentProfile.full_name,
    bio: bioText || currentProfile.bio,
    x_handle: formData.has('xHandle')
      ? (formData.get('xHandle') as string)
      : currentProfile.x_handle,
    linkedin_url: formData.has('linkedinUrl')
      ? (formData.get('linkedinUrl') as string)
      : currentProfile.linkedin_url,
    github_username: formData.has('githubUsername')
      ? (formData.get('githubUsername') as string)
      : currentProfile.github_username,
    instagram_handle: formData.has('instagramHandle')
      ? (formData.get('instagramHandle') as string)
      : currentProfile.instagram_handle,
    threads_handle: formData.has('threadsHandle')
      ? (formData.get('threadsHandle') as string)
      : currentProfile.threads_handle,
    youtube_url: formData.has('youtubeUrl')
      ? (formData.get('youtubeUrl') as string)
      : currentProfile.youtube_url,
    discord_username: formData.has('discordUsername')
      ? (formData.get('discordUsername') as string)
      : currentProfile.discord_username,
    email: formData.has('email')
      ? (formData.get('email') as string)
      : currentProfile.email,
  };

  // Handle skills separately to ensure proper array storage
  if (formData.has('skills')) {
    const skillsString = formData.get('skills') as string | null;
    const skills = skillsString
      ? skillsString
          .split(',')
          .map((skill) => skill.trim())
          .filter((skill) => skill.length > 0)
      : currentProfile.skills || [];
    updateData.skills = skills;
  }

  // Handle status tags
  const statusTags: string[] = [];
  // Get all checkboxes from STATUS_TAGS list
  for (const pair of formData.entries()) {
    const [name, value] = pair;
    if (name.startsWith('status-') && value === 'on') {
      // Convert from status-has-full-time-job format to "Has Full-Time Job"
      const tag = name
        .replace('status-', '')
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      statusTags.push(tag);
    }
  }
  updateData.status_tags =
    statusTags.length > 0 ? statusTags : currentProfile.status_tags;

  // Handle custom links (new field)
  const customLinksCount = parseInt(
    (formData.get('customLinksCount') as string) || '0',
    10
  );
  if (customLinksCount >= 0) {
    const customLinks = [];
    for (let i = 0; i < customLinksCount; i++) {
      const label = (formData.get(`customLinkLabel${i}`) as string) || '';
      const url = (formData.get(`customLinkUrl${i}`) as string) || '';

      // Only add links that have both label and url
      if (label.trim() && url.trim()) {
        customLinks.push({ label: label.trim(), url: url.trim() });
      }
    }
    updateData.custom_links = customLinks;
  }

  // Update profile with new data
  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', userId);

  if (error) {
    throw new Error(`Error updating profile: ${error.message}`);
  }

  revalidatePath('/profile/me');
  
  // Get the updated discord_username to redirect to the user's profile page
  const { data: updatedProfile } = await supabase
    .from('profiles')
    .select('discord_username')
    .eq('id', userId)
    .single();
  
  // Redirect to the user's profile page
  if (updatedProfile?.discord_username) {
    redirect(`/profile/${updatedProfile.discord_username}`);
  }
}

export async function addNsStay(formData: FormData, userId: string) {
  const supabase = await createClient();

  // Determine which format we're using - direct start_month or year/month combo
  let formattedDate: string;

  if (formData.has('start_month')) {
    // New approach - direct start_month parameter (already formatted as YYYY-MM-DD)
    formattedDate = formData.get('start_month') as string;
  } else {
    // Legacy approach - separate year and month
    const year = formData.get('year') as string;
    const month = formData.get('month') as string;

    if (!year || !month) {
      throw new Error('Either start_month or year and month are required');
    }

    // Format as YYYY-MM-01 for proper date format
    formattedDate = `${year}-${month.padStart(2, '0')}-01`;
  }

  // Add the new NS stay as a single month
  // We'll continue to use start_month since active_months doesn't exist in the table yet
  const { error } = await supabase.from('ns_stays').insert({
    user_id: userId,
    start_month: formattedDate,
    // No need for end_month for a single month stay
  });

  if (error) {
    throw new Error(`Error adding NS stay: ${error.message}`);
  }

  revalidatePath('/profile/me');
}

export async function deleteNsStay(formData: FormData, userId: string) {
  const supabase = await createClient();

  // Check for stayId or stay_id to decide which approach to use
  // Support both parameter formats for backward compatibility
  const stayId = formData.get('stayId') as string || formData.get('stay_id') as string;

  if (stayId) {
    // Delete a specific stay by ID
    const { error } = await supabase
      .from('ns_stays')
      .delete()
      .eq('id', stayId)
      .eq('user_id', userId); // Extra security check

    if (error) {
      throw new Error(`Error deleting NS stay: ${error.message}`);
    }
  } else {
    // If using month-based deletion (new approach), find the stay by month
    const year = formData.get('year') as string;
    const month = formData.get('month') as string;

    if (year && month) {
      // Format the date to match our database format
      const formattedMonth = `${year}-${month.padStart(2, '0')}-01`;

      // Find stays with this start_month
      const { data, error: fetchError } = await supabase
        .from('ns_stays')
        .select('id')
        .eq('user_id', userId)
        .eq('start_month', formattedMonth);

      if (fetchError) {
        throw new Error(`Error finding NS stay: ${fetchError.message}`);
      }

      if (data && data.length > 0) {
        // Delete each matching stay
        for (const stay of data) {
          const { error } = await supabase
            .from('ns_stays')
            .delete()
            .eq('id', stay.id)
            .eq('user_id', userId);

          if (error) {
            throw new Error(`Error deleting NS stay: ${error.message}`);
          }
        }
      }
    }
  }

  revalidatePath('/profile/me');
}
