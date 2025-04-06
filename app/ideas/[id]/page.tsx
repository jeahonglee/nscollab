import { createClient } from '@/utils/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { IdeaWithRelations } from '@/lib/supabase/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, Edit, MessageSquare, UserPlus } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { CommentsList } from '@/components/ideas/comments-list';
import { TeamMembersList } from '@/components/ideas/team-members-list';
import { DeleteIdeaButton } from '@/components/ideas/delete-idea-button';

export default async function IdeaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/sign-in');
  }

  // Fetch idea with submitter profile, team members, and comments
  const { data: idea, error } = await supabase
    .from('ideas')
    .select(
      `
      *,
      profile: profiles!ideas_submitter_user_id_fkey (
        id, full_name, avatar_url, discord_username, nspals_profile_url
      ),
      members: idea_members (
        id, user_id, role, joined_at,
        profile: profiles (
          id, full_name, avatar_url, discord_username, nspals_profile_url
        )
      ),
      comments: idea_comments (
        id, user_id, comment_text, created_at,
        profile: profiles (
          id, full_name, avatar_url, discord_username
        )
      )
    `
    )
    .eq('id', (await params).id)
    .single();

  if (error || !idea) {
    console.error('Error fetching idea:', error);
    notFound();
  }

  const ideaWithRelations = idea as IdeaWithRelations;

  // Calculate if current user is a member of this idea
  const isMember = ideaWithRelations.members?.some(
    (member) => member.user_id === user.id
  );

  // Calculate if current user is the owner
  const isOwner = ideaWithRelations.members?.some(
    (member) => member.user_id === user.id && member.role === 'Owner'
  );

  // Helper to format dates
  const formatDate = (date: string) => {
    return format(new Date(date), 'PP');
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
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Link
          href="/ideas"
          className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Ideas
        </Link>

        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{ideaWithRelations.status}</Badge>
              <span className="text-sm text-muted-foreground">
                Created{' '}
                {formatDistanceToNow(new Date(ideaWithRelations.created_at), {
                  addSuffix: true,
                })}
              </span>
            </div>
            <h1 className="text-3xl font-bold">{ideaWithRelations.title}</h1>
          </div>

          <div className="flex gap-2">
            {isOwner && (
              <>
                <Button variant="outline" asChild>
                  <Link href={`/ideas/${ideaWithRelations.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </Button>
                <DeleteIdeaButton ideaId={ideaWithRelations.id} />
              </>
            )}

            {!isMember && (
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Join Team
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Idea Description */}
          <Card>
            <CardContent className="pt-6">
              <div className="prose max-w-none">
                <p className="whitespace-pre-line">
                  {ideaWithRelations.description}
                </p>
              </div>

              {ideaWithRelations.looking_for_tags &&
                ideaWithRelations.looking_for_tags.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex flex-wrap gap-2">
                      {ideaWithRelations.looking_for_tags.map((tag) => (
                        <Badge key={tag}>{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>

          {/* Comments Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Discussion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CommentsList
                ideaId={ideaWithRelations.id}
                comments={ideaWithRelations.comments || []}
                currentUserId={user.id}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Creator Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Created by</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-3">
                <Link
                  href={`/profile/${ideaWithRelations.profile?.discord_username}`}
                >
                  <Avatar>
                    <AvatarImage
                      src={ideaWithRelations.profile?.avatar_url || ''}
                      alt={ideaWithRelations.profile?.full_name || ''}
                    />
                    <AvatarFallback>
                      {getInitials(ideaWithRelations.profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div>
                  <Link
                    href={`/profile/${ideaWithRelations.profile?.discord_username}`}
                    className="font-medium hover:underline"
                  >
                    {ideaWithRelations.profile?.full_name}
                  </Link>

                  {ideaWithRelations.profile?.discord_username && (
                    <p className="text-sm text-muted-foreground">
                      {ideaWithRelations.profile.discord_username}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 text-sm">
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Created</span>
                  <span>{formatDate(ideaWithRelations.created_at)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Last activity</span>
                  <span>{formatDate(ideaWithRelations.last_activity_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Members */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <TeamMembersList
                ideaId={ideaWithRelations.id}
                members={ideaWithRelations.members || []}
                isOwner={isOwner || false}
                currentUserId={user.id}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
