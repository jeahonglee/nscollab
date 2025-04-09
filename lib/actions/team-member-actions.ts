'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

// TeamMember interface to replace 'any' type
interface TeamMember {
  user_id: string;
  role: string;
}

/**
 * Server action to join a team
 * @param ideaId - The ID of the idea to join
 * @param userId - The ID of the user joining the team
 */
export async function joinTeam(ideaId: string, userId: string) {
  const supabase = await createClient();

  // Check if there are existing owners for this idea
  const { data: existingOwners, error: ownerError } = await supabase
    .from('idea_members')
    .select('id')
    .eq('idea_id', ideaId)
    .eq('role', 'Owner');

  if (ownerError) {
    console.error('Error checking existing owners:', ownerError);
    throw new Error('Error checking existing owners');
  }

  // If there's an existing owner, new members should be 'Member'
  // If no owners, this is the first/new owner
  const role = existingOwners && existingOwners.length > 0 ? 'Member' : 'Owner';

  // Add user as a member with the determined role
  const { error } = await supabase.from('idea_members').insert({
    idea_id: ideaId,
    user_id: userId,
    role: role,
  });

  if (error) {
    console.error('Error joining team:', error);
    throw new Error('Error joining team');
  }

  // Add a comment announcing they joined
  await supabase.from('idea_comments').insert({
    idea_id: ideaId,
    user_id: userId,
    comment_text: '👋 I joined the team!',
  });

  // Update last activity timestamp
  await supabase
    .from('ideas')
    .update({ last_activity_at: new Date().toISOString() })
    .eq('id', ideaId);

  revalidatePath(`/ideas/${ideaId}`);
}

/**
 * Server action to remove a team member
 * @param formData - Form data containing ideaId, userIdToRemove, and currentUserId
 */
export async function removeMember(formData: FormData) {
  const supabase = await createClient();

  // Get data from form
  const ideaId = formData.get('ideaId') as string;
  const userIdToRemove = formData.get('userIdToRemove') as string;
  const currentUserId = formData.get('currentUserId') as string;

  // Remove the member
  const { error } = await supabase
    .from('idea_members')
    .delete()
    .eq('idea_id', ideaId)
    .eq('user_id', userIdToRemove);

  if (error) {
    console.error('Error removing team member:', error);
    throw new Error('Error removing team member');
  }

  // Add a comment noting the removal
  await supabase.from('idea_comments').insert({
    idea_id: ideaId,
    user_id: currentUserId,
    comment_text: '🔄 A team member has been removed.',
  });

  // Update last activity timestamp
  await supabase
    .from('ideas')
    .update({ last_activity_at: new Date().toISOString() })
    .eq('id', ideaId);

  revalidatePath(`/ideas/${ideaId}`);
}

/**
 * Server action to leave a team
 * @param formData - Form data containing ideaId, currentUserId, and members
 */
export async function leaveTeam(formData: FormData) {
  const supabase = await createClient();

  // Get data from form
  const ideaId = formData.get('ideaId') as string;
  const currentUserId = formData.get('currentUserId') as string;
  const membersJson = formData.get('members') as string;
  const members = JSON.parse(membersJson);

  // Check if user is the owner and if there are other members
  const isUserOwner = members.some(
    (member: TeamMember) => member.user_id === currentUserId && member.role === 'Owner'
  );

  if (isUserOwner && members.length > 1) {
    // Cannot leave if you're the owner and there are other members
    throw new Error('Cannot leave as owner when there are other team members');
  }

  // Remove user from members
  const { error } = await supabase
    .from('idea_members')
    .delete()
    .eq('idea_id', ideaId)
    .eq('user_id', currentUserId);

  if (error) {
    console.error('Error leaving team:', error);
    throw new Error('Error leaving team');
  }

  // Add a comment announcing they left
  await supabase.from('idea_comments').insert({
    idea_id: ideaId,
    user_id: currentUserId,
    comment_text: '👋 I left the team.',
  });

  // Update last activity timestamp
  await supabase
    .from('ideas')
    .update({ last_activity_at: new Date().toISOString() })
    .eq('id', ideaId);

  revalidatePath(`/ideas/${ideaId}`);
}
