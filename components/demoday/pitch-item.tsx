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
  ideas: { title: string; description: string };
  profiles: { id: string; full_name: string | null; avatar_url: string | null; discord_username: string | null };
};

// Interface for raw data from Supabase idea_members query
interface RawIdeaMember {
  idea_id: string;
  user_id: string;
  profiles: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    discord_username: string | null;
  }[] | null; // profiles is an array here
}

type IdeaMember = {
  idea_id: string;
  user_id: string;
  profiles: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    discord_username: string | null;
  } | null;
};

interface PitchItemProps {
  pitch: Pitch;
  index: number;
  currentUser: User | null;
  onCancel: (pitchId: string) => Promise<void>;
  isCancelling: boolean;
  isEditable: boolean;
}

export default function PitchItem({ pitch, index, currentUser, onCancel, isCancelling, isEditable }: PitchItemProps) {
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
            idea_id,
            user_id,
            profiles ( id, full_name, avatar_url, discord_username )
          `)
          .eq('idea_id', pitch.idea_id)
          .neq('user_id', pitch.pitcher_id);

        if (error) throw error;
        // Transform data before setting state
        const transformedMembers: IdeaMember[] = (data || []).map((member: RawIdeaMember) => ({
          ...member,
          profiles: member.profiles?.[0] || null // Take the first profile object or null
        }));
        setMembers(transformedMembers);
      } catch (error) {
        console.error('Error fetching idea members:', error);
        setMembers([]);
      } finally {
        setIsLoadingMembers(false);
      }
    };

    if (pitch.idea_id) {
      fetchMembers();
    }
  }, [pitch.idea_id, pitch.pitcher_id, supabase]);

  const handleCancelClick = () => {
    onCancel(pitch.id);
  };

  const pitcherProfile = pitch.profiles;
  const ideaTitle = pitch.ideas?.title || 'Idea Title Missing';
  const isOwnPitch = currentUser?.id === pitch.pitcher_id;

  return (
    <div className="border rounded-md p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card hover:bg-muted/50 transition-colors duration-150 ease-in-out">
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <span className="font-mono text-lg text-muted-foreground pt-0.5">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0 space-y-2">
          {/* Idea Title Link */}
          <Link href={`/ideas/${pitch.idea_id}`} className="block hover:underline">
            <h3 className="font-semibold truncate text-base" title={ideaTitle}>{ideaTitle}</h3>
          </Link>
          {/* Idea Description */}
          <p className="text-sm text-muted-foreground line-clamp-2" title={pitch.ideas.description}>
            {pitch.ideas.description || 'No description provided.'}
          </p>
          {/* Pitcher & Members */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1">
            {/* Pitcher Link (Avatar + Name) */}
            {pitcherProfile?.discord_username ? (
              <Link href={`/profile/${pitcherProfile.discord_username}`} className="flex items-center gap-1.5 group flex-shrink-0">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={pitcherProfile?.avatar_url || ''} alt={pitcherProfile?.full_name || 'P'} />
                  <AvatarFallback className="text-xs">{getInitials(pitcherProfile?.full_name)}</AvatarFallback>
                </Avatar>
                <span className="text-xs truncate font-medium group-hover:underline">{pitcherProfile?.full_name || 'Unknown User'}</span>
              </Link>
            ) : (
              // Fallback if no discord_username
              <div className="flex items-center gap-1.5 flex-shrink-0 text-muted-foreground">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={pitcherProfile?.avatar_url || ''} alt={pitcherProfile?.full_name || 'P'} />
                  <AvatarFallback className="text-xs">{getInitials(pitcherProfile?.full_name)}</AvatarFallback>
                </Avatar>
                <span className="text-xs truncate font-medium">{pitcherProfile?.full_name || 'Unknown User'}</span>
              </div>
            )}

            {/* Display Member Avatars Only */}
            <div className="flex items-center flex-shrink-0">
              {isLoadingMembers ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-2" />
              ) : (
                <div className="flex -space-x-1.5 overflow-hidden ml-1">
                  {members.map(member => (
                    member.profiles && member.profiles.discord_username && (
                      /* Member Link */
                      <Link key={member.user_id} href={`/profile/${member.profiles.discord_username}`}>
                        <Avatar className="h-5 w-5 border border-background hover:ring-1 hover:ring-primary transition-all duration-150" title={member.profiles.full_name || 'Member'}>
                          <AvatarImage src={member.profiles.avatar_url || ''} alt={member.profiles.full_name || 'M'} />
                          <AvatarFallback className="text-xs">{getInitials(member.profiles.full_name)}</AvatarFallback>
                        </Avatar>
                      </Link>
                    )
                  ))}
                  {/* Optional: Add a +N indicator if too many members */}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Button */}
      {isOwnPitch && isEditable && (
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
          onClick={handleCancelClick}
          title="Cancel Pitch Submission"
          disabled={isCancelling}
        >
          {isCancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
      )}
    </div>
  );
}
