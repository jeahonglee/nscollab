'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { LOOKING_FOR_TAGS } from '@/lib/supabase/types';

export async function submitIdea(formData: FormData, userId: string) {
  const supabase = await createClient();

  // Get form data
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const status = formData.get('status') as string;

  // Get looking_for tags
  const lookingForTags = LOOKING_FOR_TAGS.filter(
    (tag) =>
      formData.get(`looking-for-${tag.replace(/\s/g, '-').toLowerCase()}`) ===
      'on'
  );

  // Create idea in database
  const { data: idea, error } = await supabase
    .from('ideas')
    .insert({
      submitter_user_id: userId,
      title,
      description,
      status,
      looking_for_tags: lookingForTags.length > 0 ? lookingForTags : null,
      is_archived: false,
      last_activity_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error submitting idea:', error);
    throw new Error('Failed to submit idea');
  }

  // Add the creator as the first team member with "Owner" role
  const { error: memberError } = await supabase.from('idea_members').insert({
    idea_id: idea.id,
    user_id: userId,
    role: 'Owner',
  });

  if (memberError) {
    console.error('Error adding owner to idea:', memberError);
  }

  // Add a welcome comment
  const { error: commentError } = await supabase.from('idea_comments').insert({
    idea_id: idea.id,
    user_id: userId,
    comment_text: '🚀 Created this idea! Looking forward to making it happen.',
  });

  if (commentError) {
    console.error('Error adding welcome comment:', commentError);
  }

  revalidatePath('/ideas');
  return idea.id;
}
