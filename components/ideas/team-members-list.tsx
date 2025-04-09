"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus } from 'lucide-react';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { joinTeam, removeMember, leaveTeam } from '@/lib/actions/team-member-actions';

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
  // Loading states
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Sort members by role (owners first) and join date
  const sortedMembers = [...members].sort((a, b) => {
    if (a.role === 'Owner' && b.role !== 'Owner') return -1;
    if (a.role !== 'Owner' && b.role === 'Owner') return 1;
    return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
  });

  // Check if current user is already a member
  const isMember = members.some((member) => member.user_id === currentUserId);

  // Handle joining team
  const handleJoinTeam = async () => {
    setIsJoining(true);
    try {
      await joinTeam(ideaId, currentUserId);
    } catch (error) {
      console.error('Error joining team:', error);
    } finally {
      setIsJoining(false);
    }
  };

  // Handle removing a team member
  const handleRemoveMember = async (userIdToRemove: string) => {
    setIsRemoving(true);
    try {
      const formData = new FormData();
      formData.append('ideaId', ideaId);
      formData.append('userIdToRemove', userIdToRemove);
      formData.append('currentUserId', currentUserId);
      
      await removeMember(formData);
    } catch (error) {
      console.error('Error removing team member:', error);
    } finally {
      setIsRemoving(false);
    }
  };

  // Handle leaving team
  const handleLeaveTeam = async () => {
    setIsLeaving(true);
    try {
      const formData = new FormData();
      formData.append('ideaId', ideaId);
      formData.append('currentUserId', currentUserId);
      formData.append('members', JSON.stringify(members));
      
      await leaveTeam(formData);
    } catch (error) {
      console.error('Error leaving team:', error);
    } finally {
      setIsLeaving(false);
    }
  };

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
    <div className="space-y-4 relative">
      <LoadingOverlay isLoading={isJoining} loadingText="Joining team..." />
      <LoadingOverlay isLoading={isLeaving} loadingText="Leaving team..." />
      <LoadingOverlay isLoading={isRemoving} loadingText="Removing member..." />
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
            <Button 
              onClick={() => handleRemoveMember(member.user_id)} 
              variant="ghost" 
              size="sm" 
              className="h-7"
              disabled={isRemoving}
            >
              Remove
            </Button>
          )}
        </div>
      ))}

      {/* Actions */}
      <div className="pt-4 mt-4 border-t">
        {!isMember ? (
          <Button 
            onClick={handleJoinTeam} 
            className="w-full" 
            size="sm"
            disabled={isJoining}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Join Team
          </Button>
        ) : (
          <Button 
            onClick={handleLeaveTeam} 
            variant="outline" 
            className="w-full" 
            size="sm"
            disabled={isLeaving}
          >
            <UserMinus className="h-4 w-4 mr-2" />
            Leave Team
          </Button>
        )}
      </div>
    </div>
  );
}
