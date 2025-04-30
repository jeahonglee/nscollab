'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { notifyIdeaMembersAboutComment } from '@/lib/email';

export async function addComment(
  formData: FormData,
  ideaId: string,
  userId: string
) {
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
    // 1. Fetch the idea details (title)
    const { data: ideaData, error: ideaError } = await supabase
      .from('ideas')
      .select('title')
      .eq('id', ideaId)
      .single();

    if (ideaError || !ideaData) {
      console.error('Error fetching idea details for notification:', ideaError);
      // Continue without sending email if idea fetch fails
    } else {
      const ideaTitle = ideaData.title;

      // 2. Fetch all idea members including the owner
      const { data: ideaMembers, error: membersError } = await supabase
        .from('idea_members')
        .select('user_id')
        .eq('idea_id', ideaId);

      if (membersError || !ideaMembers) {
        console.error(
          'Error fetching idea members for notification:',
          membersError
        );
      } else {
        // 3. Get all member emails
        const memberIds = ideaMembers.map((member) => member.user_id);

        if (memberIds.length > 0) {
          const { data: memberProfiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, email')
            .in('id', memberIds);

          if (profilesError || !memberProfiles) {
            console.error(
              'Error fetching member profiles for notification:',
              profilesError
            );
          } else {
            // 4. Fetch the commenter's profile (just need full_name)
            const { data: commenterProfile, error: commenterError } =
              await supabase
                .from('profiles')
                .select('id, full_name, email')
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
            const commenterEmail = commenterProfile?.email || '';

            // 5. Get all member emails
            const ideaMemberEmails = memberProfiles
              .filter((profile) => profile.email) // Ensure email exists
              .map((profile) => profile.email as string);

            if (ideaMemberEmails.length > 0) {
              // 6. Send notification to all members
              await notifyIdeaMembersAboutComment({
                ideaId,
                ideaTitle,
                ideaMembers: ideaMemberEmails,
                commenterEmail,
                commenterName,
                commentText,
              });
            }
          }
        }
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

export async function deleteComment(
  formData: FormData,
  ideaId: string,
  userId: string
) {
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
