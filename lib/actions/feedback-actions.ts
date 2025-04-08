'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Adds a new feedback message to the system
 */
export async function addFeedback(message: string) {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'You must be signed in to leave feedback' };
  }

  // Insert the feedback
  const { error } = await supabase.from('feedbacks').insert([
    {
      user_id: user.id,
      message,
    },
  ]);

  if (error) {
    console.error('Error adding feedback:', error);
    return { error: 'Failed to add feedback. Please try again.' };
  }

  // Revalidate the dashboard page to show the new feedback
  revalidatePath('/dashboard');
  return { success: true };
}

/**
 * Deletes a feedback message
 */
export async function deleteFeedback(id: string) {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'You must be signed in to delete feedback' };
  }

  // Delete the feedback (RLS will handle permission check)
  const { error } = await supabase.from('feedbacks').delete().eq('id', id);

  if (error) {
    console.error('Error deleting feedback:', error);
    return { error: 'Failed to delete feedback. Please try again.' };
  }

  // Revalidate the dashboard page
  revalidatePath('/dashboard');
  return { success: true };
}
