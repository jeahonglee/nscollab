'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addComment(formData: FormData, ideaId: string, userId: string) {
  const commentText = formData.get('comment') as string;
  if (!commentText.trim()) {
    throw new Error('Comment text is required');
  }

  const supabase = await createClient();

  // Add comment
  const { error } = await supabase.from('idea_comments').insert({
    idea_id: ideaId,
    user_id: userId,
    comment_text: commentText,
  });

  if (error) {
    console.error('Error adding comment:', error);
    throw new Error('Failed to add comment');
  }

  // Update last activity timestamp
  await supabase
    .from('ideas')
    .update({ last_activity_at: new Date().toISOString() })
    .eq('id', ideaId);

  revalidatePath(`/ideas/${ideaId}`);
  
  return { success: true };
}

export async function deleteComment(formData: FormData, ideaId: string, userId: string) {
  const commentId = formData.get('commentId') as string;
  if (!commentId) {
    throw new Error('Comment ID is required');
  }

  const supabase = await createClient();

  // Delete the comment
  const { error } = await supabase
    .from('idea_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', userId); // Security check: ensure only the comment owner can delete

  if (error) {
    console.error('Error deleting comment:', error);
    throw new Error('Failed to delete comment');
  }

  // Update last activity timestamp
  await supabase
    .from('ideas')
    .update({ last_activity_at: new Date().toISOString() })
    .eq('id', ideaId);

  revalidatePath(`/ideas/${ideaId}`);
  
  return { success: true };
}
