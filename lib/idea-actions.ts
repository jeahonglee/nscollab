'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { LOOKING_FOR_TAGS } from '@/lib/supabase/types';

// Type for looking_for_tags (derived from const array)
type LookingForTag = (typeof LOOKING_FOR_TAGS)[number];

export async function updateIdea(formData: FormData, ideaId: string) {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // First, fetch the current idea to ensure we only update changed fields
  const { data: currentIdea, error: fetchError } = await supabase
    .from('ideas')
    .select('*')
    .eq('id', ideaId)
    .single();

  if (fetchError) {
    console.error('Error fetching current idea data:', fetchError);
    throw new Error('Failed to fetch current idea');
  }

  // Create an update object for only changed fields
  const updateData: Record<string, string | string[] | null> = {};

  // Track changes for comment
  const changes: string[] = [];

  // Only update fields that are present in the form
  if (formData.has('title')) {
    const newTitle = formData.get('title') as string;
    if (newTitle !== currentIdea.title) {
      updateData.title = newTitle;
      changes.push(
        `Changed title from "${currentIdea.title}" to "${newTitle}"`
      );
    }
  }

  if (formData.has('description')) {
    const newDescription = formData.get('description') as string;
    if (newDescription !== currentIdea.description) {
      updateData.description = newDescription;
      changes.push(`Updated description`);
    }
  }

  if (formData.has('status')) {
    const newStatus = formData.get('status') as string;
    if (newStatus !== currentIdea.status) {
      updateData.status = newStatus;
      changes.push(
        `Changed status from "${currentIdea.status}" to "${newStatus}"`
      );
    }
  }

  // Handle looking_for_tags field
  const lookingForTags = LOOKING_FOR_TAGS.filter(
    (tag: LookingForTag) =>
      formData.get(`looking-for-${tag.replace(/\s/g, '-').toLowerCase()}`) ===
      'on'
  );

  // Only update if the form has looking_for_tags checkboxes
  if (
    LOOKING_FOR_TAGS.some((tag: LookingForTag) =>
      formData.has(`looking-for-${tag.replace(/\s/g, '-').toLowerCase()}`)
    )
  ) {
    const oldTags = currentIdea.looking_for_tags || [];
    const newTags = lookingForTags.length > 0 ? lookingForTags : [];

    // Check if tags have changed
    if (JSON.stringify(oldTags.sort()) !== JSON.stringify(newTags.sort())) {
      updateData.looking_for_tags = newTags.length > 0 ? newTags : null;

      // Generate a meaningful change message about tags
      if (oldTags.length === 0 && newTags.length > 0) {
        changes.push(`Added looking for tags: ${newTags.join(', ')}`);
      } else if (oldTags.length > 0 && newTags.length === 0) {
        changes.push(`Removed all looking for tags`);
      } else {
        // Find added and removed tags
        const added = newTags.filter(
          (tag: LookingForTag) => !oldTags.includes(tag)
        );
        const removed = oldTags.filter(
          (tag: LookingForTag) => !newTags.includes(tag)
        );

        if (added.length > 0) {
          changes.push(`Added tags: ${added.join(', ')}`);
        }
        if (removed.length > 0) {
          changes.push(`Removed tags: ${removed.join(', ')}`);
        }
      }
    }
  }

  // Update last_activity_at timestamp
  updateData.updated_at = new Date().toISOString();
  updateData.last_activity_at = new Date().toISOString();

  // Check if there are any updates to make
  if (Object.keys(updateData).length === 0) {
    // No fields were changed
    return;
  }

  // Update the idea
  const { error: updateError } = await supabase
    .from('ideas')
    .update(updateData)
    .eq('id', ideaId);

  if (updateError) {
    console.error('Error updating idea:', updateError);
    throw new Error('Failed to update idea');
  }

  // Add a comment with the changes made
  if (changes.length > 0) {
    const commentText = `📝 Updated the idea:\n${changes.map((change) => `- ${change}`).join('\n')}`;

    const { error: commentError } = await supabase
      .from('idea_comments')
      .insert({
        idea_id: ideaId,
        user_id: user.id,
        comment_text: commentText,
      });

    if (commentError) {
      console.error('Error adding update comment:', commentError);
    }
  }

  // Revalidate paths to update the UI
  revalidatePath(`/ideas/${ideaId}`);
  revalidatePath('/ideas');

  // Return success
  return { success: true };
}
