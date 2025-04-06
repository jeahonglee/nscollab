'use server';

import { encodedRedirect } from '@/utils/utils';
import { createClient } from '@/utils/supabase/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Provider } from '@supabase/supabase-js';

// OAuth sign-in action for Google, Apple, Discord
export const signInWithOAuthAction = async (provider: Provider) => {
  const supabase = await createClient();
  const origin = (await headers()).get('origin');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        prompt: 'consent', // forces consent screen to show on every login
      },
    },
  });

  if (error) {
    console.error(`OAuth sign-in error (${provider}):`, error.message);
    return encodedRedirect('error', '/sign-in', error.message);
  }

  // Redirect to the OAuth provider's login page
  return redirect(data.url);
};

// Keep existing signUpAction for now, but users will primarily use OAuth
export const signUpAction = async (formData: FormData) => {
  const email = formData.get('email')?.toString();
  const password = formData.get('password')?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get('origin');

  if (!email || !password) {
    return encodedRedirect(
      'error',
      '/sign-up',
      'Email and password are required'
    );
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error(error.code + ' ' + error.message);
    return encodedRedirect('error', '/sign-up', error.message);
  } else {
    return encodedRedirect(
      'success',
      '/sign-up',
      'Thanks for signing up! Please check your email for a verification link.'
    );
  }
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect('error', '/sign-in', error.message);
  }

  return redirect('/dashboard');
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect('/sign-in');
};

export const deleteIdeaAction = async (ideaId: string) => {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'You must be logged in to delete an idea' };
  }

  // Check if user is the owner of the idea
  const { data: members, error: memberError } = await supabase
    .from('idea_members')
    .select('*')
    .eq('idea_id', ideaId)
    .eq('user_id', user.id)
    .eq('role', 'Owner')
    .single();

  if (memberError || !members) {
    console.error('Error checking ownership:', memberError);
    return { success: false, error: 'Only the owner can delete this idea' };
  }

  // With RLS policies in place, we can now directly delete the idea
  // The cascade delete will handle comments and team members
  const { error: ideaError } = await supabase
    .from('ideas')
    .delete()
    .eq('id', ideaId);

  if (ideaError) {
    console.error('Error deleting idea:', ideaError);
    return {
      success: false,
      error:
        'Failed to delete the idea. Please make sure the RLS policy is applied.',
    };
  }

  return { success: true };
};
