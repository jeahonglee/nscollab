'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { sendCommentNotificationEmail } from '@/lib/email';

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

  // --- Start Notification Logic ---
  try {
    // 1. Fetch the idea details (including submitter_user_id and title)
    const { data: ideaData, error: ideaError } = await supabase
      .from('ideas')
      .select('submitter_user_id, title')
      .eq('id', ideaId)
      .single();

    if (ideaError || !ideaData) {
      console.error('Error fetching idea details for notification:', ideaError);
      // Continue without sending email if idea fetch fails
    } else {
      const ownerId = ideaData.submitter_user_id;
      const ideaTitle = ideaData.title;

      // 2. Check if the commenter is the owner
      if (userId !== ownerId) {
        // 3. Fetch the owner's profile (including email)
        const { data: ownerProfile, error: ownerError } = await supabase
          .from('profiles')
          .select('email, full_name') // Select email and name (optional, maybe just log name)
          .eq('id', ownerId)
          .single();

        if (ownerError) {
          console.error(
            "Error fetching owner's profile for notification:",
            ownerError
          );
        } else if (ownerProfile && ownerProfile.email) {
          // 4. Fetch the commenter's profile (just need full_name)
          const { data: commenterProfile, error: commenterError } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', userId)
            .single();

          if (commenterError) {
            console.error(
              "Error fetching commenter's profile for notification:",
              commenterError
            );
            // Proceed with a fallback name if fetch fails
          }

          const commenterName = commenterProfile?.full_name || 'Someone'; // Fallback name

          // 5. Send the email notification
          console.log(
            `Attempting to send notification email to ${ownerProfile.email}`
          );
          await sendCommentNotificationEmail({
            to: ownerProfile.email,
            ideaTitle: ideaTitle,
            ideaId: ideaId,
            commenterName: commenterName,
            commentText: commentText,
          });
        } else {
          console.log(
            `Owner (ID: ${ownerId}) has no email address or profile not found. Skipping notification.`
          );
        }
      } else {
        console.log('Commenter is the owner. Skipping notification.');
      }
    }
  } catch (emailError) {
    // Log any error during the notification process but don't fail the comment action
    console.error('Failed to send comment notification email:', emailError);
  }
  // --- End Notification Logic ---

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
