import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus } from 'lucide-react';

interface Member {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profile?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    discord_username: string | null;
    nspals_profile_url: string | null;
  } | null;
}

interface TeamMembersListProps {
  ideaId: string;
  members: Member[];
  isOwner: boolean;
  currentUserId: string;
}

export function TeamMembersList({
  ideaId,
  members,
  isOwner,
  currentUserId,
}: TeamMembersListProps) {
  // Sort members by role (owners first) and join date
  const sortedMembers = [...members].sort((a, b) => {
    if (a.role === 'Owner' && b.role !== 'Owner') return -1;
    if (a.role !== 'Owner' && b.role === 'Owner') return 1;
    return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
  });

  // Check if current user is already a member
  const isMember = members.some((member) => member.user_id === currentUserId);

  // Server action to join a team
  async function joinTeam() {
    'use server';

    const supabase = await createClient();

    // Check if there are existing owners for this idea
    const { data: existingOwners, error: ownerError } = await supabase
      .from('idea_members')
      .select('id')
      .eq('idea_id', ideaId)
      .eq('role', 'Owner');

    if (ownerError) {
      console.error('Error checking existing owners:', ownerError);
      return;
    }

    // If there's an existing owner, new members should be 'Member'
    // If no owners, this is the first/new owner
    const role = existingOwners && existingOwners.length > 0 ? 'Member' : 'Owner';

    // Add user as a member with the determined role
    const { error } = await supabase.from('idea_members').insert({
      idea_id: ideaId,
      user_id: currentUserId,
      role: role,
    });

    if (error) {
      console.error('Error joining team:', error);
      return;
    }

    // Add a comment announcing they joined
    await supabase.from('idea_comments').insert({
      idea_id: ideaId,
      user_id: currentUserId,
      comment_text: '👋 I joined the team!',
    });

    // Update last activity timestamp
    await supabase
      .from('ideas')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', ideaId);

    revalidatePath(`/ideas/${ideaId}`);
  }

  // Server action to remove a team member
  async function removeMember(formData: FormData) {
    'use server';

    const supabase = await createClient();

    // Get data from form
    const ideaId = formData.get('ideaId') as string;
    const userIdToRemove = formData.get('userIdToRemove') as string;

    // Remove the member
    const { error } = await supabase
      .from('idea_members')
      .delete()
      .eq('idea_id', ideaId)
      .eq('user_id', userIdToRemove);

    if (error) {
      console.error('Error removing team member:', error);
      return;
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

  // Server action to leave a team
  async function leaveTeam(formData: FormData) {
    'use server';

    const supabase = await createClient();

    // Get data from form
    const ideaId = formData.get('ideaId') as string;
    const currentUserId = formData.get('currentUserId') as string;
    const membersJson = formData.get('members') as string;
    const members = JSON.parse(membersJson);

    // Check if user is the owner and if there are other members
    const isUserOwner = members.some(
      (member: Member) =>
        member.user_id === currentUserId && member.role === 'Owner'
    );

    if (isUserOwner && members.length > 1) {
      // Cannot leave if you're the owner and there are other members
      return;
    }

    // Remove user from members
    const { error } = await supabase
      .from('idea_members')
      .delete()
      .eq('idea_id', ideaId)
      .eq('user_id', currentUserId);

    if (error) {
      console.error('Error leaving team:', error);
      return;
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

  // Get initials for avatar fallback
  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'NS';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="space-y-4">
      {sortedMembers.map((member) => (
        <div key={member.id} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/profile/${member.profile?.discord_username}`}>
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={member.profile?.avatar_url || ''}
                  alt={member.profile?.full_name || ''}
                />
                <AvatarFallback>
                  {getInitials(member.profile?.full_name)}
                </AvatarFallback>
              </Avatar>
            </Link>

            <div>
              <Link
                href={`/profile/${member.profile?.discord_username}`}
                className="font-medium hover:underline"
              >
                {member.profile?.full_name || 'Unknown'}
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
                  {member.role}
                </span>
                {member.user_id === currentUserId && (
                  <span className="text-xs text-muted-foreground">(You)</span>
                )}
              </div>
            </div>
          </div>

          {isOwner && member.user_id !== currentUserId && (
            <form action={removeMember}>
              <input type="hidden" name="ideaId" value={ideaId} />
              <input type="hidden" name="userIdToRemove" value={member.user_id} />
              <Button type="submit" variant="ghost" size="sm" className="h-7">
                Remove
              </Button>
            </form>
          )}
        </div>
      ))}

      {/* Actions */}
      <div className="pt-4 mt-4 border-t">
        {!isMember ? (
          <form action={joinTeam}>
            <Button className="w-full" size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Join Team
            </Button>
          </form>
        ) : (
          <form action={leaveTeam}>
            <input type="hidden" name="ideaId" value={ideaId} />
            <input type="hidden" name="currentUserId" value={currentUserId} />
            <input
              type="hidden"
              name="members"
              value={JSON.stringify(members)}
            />
            <Button variant="outline" className="w-full" size="sm">
              <UserMinus className="h-4 w-4 mr-2" />
              Leave Team
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
