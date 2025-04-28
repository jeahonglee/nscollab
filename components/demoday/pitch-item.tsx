'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Trash2 } from 'lucide-react';
import { getInitials } from '@/utils/get-initials'; // Assuming a utility function exists

// TODO: Define proper types, potentially generated from Supabase
type Pitch = {
  id: string;
  idea_id: string;
  pitcher_id: string;
  ideas: { title: string };
  profiles: { id: string; full_name: string | null; avatar_url: string | null; discord_username: string | null }; // Added id and discord_username
};
type IdeaMember = {
  idea_id: string;
  user_id: string;
  profiles: { // Nested profiles object
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    discord_username: string | null; // Added discord_username
  } | null; // profiles can be null if join fails
};

interface PitchItemProps {
  pitch: Pitch;
  index: number;
  currentUser: User | null;
  onCancel: (pitchId: string) => Promise<void>; // Function to call when cancelling
  isCancelling: boolean; // Is this specific pitch being cancelled?
}

export default function PitchItem({ pitch, index, currentUser, onCancel, isCancelling }: PitchItemProps) {
  const [members, setMembers] = useState<IdeaMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchMembers = async () => {
      setIsLoadingMembers(true);
      try {
        const { data, error } = await supabase
          .from('idea_members')
          .select(`
            user_id,
            profiles ( id, full_name, avatar_url, discord_username ) /* Fetch discord_username */
          `)
          .eq('idea_id', pitch.idea_id)
          .neq('user_id', pitch.pitcher_id); // Exclude the pitcher if they are also a member record

        if (error) throw error;
        setMembers(data || []);
      } catch (error) {
        console.error(`Error fetching members for idea ${pitch.idea_id}:`, error);
        setMembers([]); // Set empty on error
      } finally {
        setIsLoadingMembers(false);
      }
    };

    if (pitch.idea_id) {
      fetchMembers();
    }
  }, [pitch.idea_id]); // Dependency array

  const handleCancelClick = () => {
    onCancel(pitch.id);
  };

  const pitcherProfile = pitch.profiles;
  const ideaTitle = pitch.ideas?.title || 'Idea Title Missing';
  const isOwnPitch = currentUser?.id === pitch.pitcher_id;

  return (
    <div className="flex items-center gap-4 py-3 border-b border-border last:border-b-0">
      <span className="font-mono text-lg text-muted-foreground self-start pt-1">
        {index + 1}
      </span>
      {/* Single-line layout for pitch info */}
      <div className="flex flex-1 items-center gap-x-4 gap-y-1 min-w-0 flex-wrap">
        {/* Idea Title Link */}
        <Link href={`/ideas/${pitch.idea_id}`} className="hover:underline flex-shrink-0 mr-2">
          <p className="font-medium truncate text-base" title={ideaTitle}>{ideaTitle}</p>
        </Link>

        {/* Pitcher Link (Avatar + Name) */}
        {pitcherProfile?.discord_username ? (
          <Link href={`/profile/${pitcherProfile.discord_username}`} className="flex items-center gap-1.5 group flex-shrink-0">
            <Avatar className="h-6 w-6">
              <AvatarImage src={pitcherProfile?.avatar_url || ''} alt={pitcherProfile?.full_name || 'P'} />
              <AvatarFallback className="text-xs">{getInitials(pitcherProfile?.full_name)}</AvatarFallback>
            </Avatar>
            <span className="text-sm truncate font-medium group-hover:underline">{pitcherProfile?.full_name || 'Unknown User'}</span>
          </Link>
        ) : (
          // Fallback if no discord_username
          <div className="flex items-center gap-1.5 flex-shrink-0 text-muted-foreground">
            <Avatar className="h-6 w-6">
              <AvatarImage src={pitcherProfile?.avatar_url || ''} alt={pitcherProfile?.full_name || 'P'} />
              <AvatarFallback className="text-xs">{getInitials(pitcherProfile?.full_name)}</AvatarFallback>
            </Avatar>
            <span className="text-sm truncate font-medium">{pitcherProfile?.full_name || 'Unknown User'}</span>
          </div>
        )}

        {/* Display Member Avatars Only */}
        <div className="flex items-center flex-shrink-0">
          {isLoadingMembers ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-2" />
          ) : (
            <div className="flex -space-x-2 overflow-hidden ml-2">
              {members.map(member => (
                member.profiles && member.profiles.discord_username && (
                  /* Member Link */
                  <Link key={member.user_id} href={`/profile/${member.profiles.discord_username}`}>
                    <Avatar className="h-6 w-6 border-2 border-background hover:ring-2 hover:ring-primary transition-all duration-150" title={member.profiles.full_name || 'Member'}>
                      <AvatarImage src={member.profiles.avatar_url || ''} alt={member.profiles.full_name || 'M'} />
                      <AvatarFallback className="text-xs">{getInitials(member.profiles.full_name)}</AvatarFallback>
                    </Avatar>
                  </Link>
                )
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cancel Button */}
      {isOwnPitch && (
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive flex-shrink-0 ml-auto sm:ml-4"
          onClick={handleCancelClick}
          disabled={isCancelling}
          aria-label="Cancel Pitch Submission"
        >
          {isCancelling ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  );
}
