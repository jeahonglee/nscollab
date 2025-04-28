import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow, subWeeks, startOfWeek, format } from 'date-fns';
import { MessageSquare, Lightbulb, Clock, ChevronDown, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FeedbackBoard from '@/components/FeedbackBoard';
import { SimpleContributionGraph } from '@/components/ui/simple-contribution-graph';
import { getAllUsersContributions, getAllIdeasContributions } from '@/app/actions/contributionActions';

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<{ weeks?: string }>;
}) {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/sign-in');
  }

  // Determine how many weeks of comments to load
  const params = await searchParams;
  const weeksToLoad = parseInt(params.weeks || '1', 10);

  // Calculate the date range for comments
  const today = new Date();
  const startDate = startOfWeek(subWeeks(today, weeksToLoad));
  const startDateString = startDate.toISOString();

  // Fetch feedbacks
  const { data: rawFeedbacks, error: feedbacksError } = await supabase
    .from('feedbacks')
    .select(
      `
      id,
      message,
      user_id,
      created_at,
      profile: profiles (id, full_name, avatar_url)
    `
    )
    .order('created_at', { ascending: false })
    .limit(50);

  if (feedbacksError) {
    console.error('Error fetching feedbacks:', feedbacksError);
  }

  // Process the feedbacks to handle nested profile data correctly
  const feedbacks = (rawFeedbacks || []).map((feedback) => {
    const rawFeedback = feedback as Record<string, unknown>;

    // Extract profile (might be an array or object)
    let profile = null;
    if (rawFeedback.profile) {
      if (
        Array.isArray(rawFeedback.profile) &&
        rawFeedback.profile.length > 0
      ) {
        profile = rawFeedback.profile[0];
      } else {
        profile = rawFeedback.profile;
      }
    }

    return {
      id: rawFeedback.id as string,
      message: rawFeedback.message as string,
      user_id: rawFeedback.user_id as string,
      created_at: rawFeedback.created_at as string,
      profile: profile as {
        id: string;
        full_name: string | null;
        avatar_url: string | null;
      } | null,
    };
  });

  // Fetch comments from the last X weeks with related data
  const { data: recentComments, error } = await supabase
    .from('idea_comments')
    .select(
      `
      id,
      idea_id,
      user_id,
      comment_text,
      created_at,
      profile: profiles (
        id, full_name, avatar_url, discord_username
      ),
      idea: ideas (
        id, title, status, description, created_at, submitter_user_id,
        profile: profiles!ideas_submitter_user_id_fkey (
          id, full_name, avatar_url, discord_username
        )
      )
    `
    )
    .gte('created_at', startDateString)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching recent comments:', error);
  }

  // Define the processed comment type
  type ProcessedComment = {
    id: string;
    idea_id: string;
    user_id: string;
    comment_text: string;
    created_at: string;
    profile: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
      discord_username: string | null;
    } | null;
    idea: {
      id: string;
      title: string;
      status: string;
      description: string;
      created_at: string;
      submitter_user_id: string;
      profile: {
        id: string;
        full_name: string | null;
        avatar_url: string | null;
        discord_username: string | null;
      } | null;
    } | null;
  };

  // Process the data to handle possible array/nested structures and group by idea
  const processComments = (recentComments || []).map((comment) => {
    // Cast to appropriate type to avoid TypeScript errors during transformation
    const rawComment = comment as Record<string, unknown>;

    // Extract profile (might be an array or object)
    let profile = null;
    if (rawComment.profile) {
      if (Array.isArray(rawComment.profile) && rawComment.profile.length > 0) {
        profile = rawComment.profile[0];
      } else {
        profile = rawComment.profile;
      }
    }

    // Extract idea (might be an array or object)
    let idea = null;
    if (rawComment.idea) {
      let ideaObj;
      if (Array.isArray(rawComment.idea) && rawComment.idea.length > 0) {
        ideaObj = rawComment.idea[0];
      } else {
        ideaObj = rawComment.idea;
      }

      // Extract idea profile (might be an array or object)
      let ideaProfile = null;
      if (ideaObj.profile) {
        if (Array.isArray(ideaObj.profile) && ideaObj.profile.length > 0) {
          ideaProfile = ideaObj.profile[0];
        } else {
          ideaProfile = ideaObj.profile;
        }
      }

      idea = {
        ...ideaObj,
        profile: ideaProfile,
      };
    }

    // Return the processed comment
    return {
      id: rawComment.id,
      idea_id: rawComment.idea_id,
      user_id: rawComment.user_id,
      comment_text: rawComment.comment_text,
      created_at: rawComment.created_at,
      profile,
      idea,
    };
  }) as ProcessedComment[];

  // Group comments by idea_id
  type GroupedIdeas = {
    [ideaId: string]: {
      idea: ProcessedComment['idea'];
      comments: ProcessedComment[];
    };
  };

  const groupedByIdea: GroupedIdeas = {};

  // Create groups of comments by idea
  processComments.forEach((comment) => {
    if (!comment.idea || !comment.idea.id) return;

    const ideaId = comment.idea.id;

    if (!groupedByIdea[ideaId]) {
      groupedByIdea[ideaId] = {
        idea: comment.idea,
        comments: [],
      };
    }

    groupedByIdea[ideaId].comments.push(comment);
  });

  // Sort comments within each idea by date (newest first)
  Object.values(groupedByIdea).forEach((group) => {
    group.comments.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });

  // Convert to array and sort ideas by most recent comment
  const ideasWithComments = Object.values(groupedByIdea).sort((a, b) => {
    if (!a.comments.length || !b.comments.length) return 0;

    return (
      new Date(b.comments[0].created_at).getTime() -
      new Date(a.comments[0].created_at).getTime()
    );
  });
  
  // Fetch contribution data for all users to show overall activity
  const usersContributionsMap = await getAllUsersContributions();
  
  // Fetch contribution data for all ideas
  const ideasContributionsMap = await getAllIdeasContributions();
  
  // Combine all user contributions into one dataset for the activity overview
  const allContributions: Array<{ date: string; count: number }> = [];
  const contributionsByDate: Record<string, number> = {};
  
  // Aggregate contribution counts by date
  Object.values(usersContributionsMap).forEach(userContributions => {
    userContributions.forEach(({ date, count }) => {
      contributionsByDate[date] = (contributionsByDate[date] || 0) + count;
    });
  });
  
  // Convert to array format for the graph
  Object.entries(contributionsByDate).forEach(([date, count]) => {
    allContributions.push({ date, count });
  });
  
  // Sort by date (ascending)
  allContributions.sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  // Helper function to get initials for avatar fallback
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
    <div className="space-y-6">
      {/* <div>
        <h1 className="text-3xl md:text-4xl font-bold">Timeline</h1>
        <p className="text-base md:text-lg text-muted-foreground">
          Recent activity from the NS Collab
        </p>
      </div> */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Activity Overview Card - top row, full width */}
        <div className="md:col-span-3 mb-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <BarChart className="h-5 w-5 mr-2" />
                Activity Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-hidden">
                <SimpleContributionGraph 
                  data={allContributions}
                  size="sm"
                  showTooltips={true}
                  rightAligned={true}
                  className="justify-end w-full"
                  dense={true}
                />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="pb-6 border-b-2">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center text-2xl">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Recent Activities
                </CardTitle>
                <div className="text-sm text-muted-foreground flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {weeksToLoad} week{weeksToLoad !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {format(startDate, 'MMM d, yyyy')} —{' '}
                {format(new Date(), 'MMM d, yyyy')}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mt-2">
                {ideasWithComments.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent comments yet. Start a conversation on an idea!
                  </div>
                )}

                {ideasWithComments.map((ideaGroup) => (
                  <div key={ideaGroup.idea?.id} className="mb-4 py-6 border-b">
                    {/* Idea header with link and creator info */}
                    {ideaGroup.idea && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/ideas/${ideaGroup.idea.id}`}
                              className="inline-flex items-center gap-1.5 hover:underline"
                            >
                              <Lightbulb className="h-4 w-4 text-primary" />
                              <span className="font-semibold text-lg">
                                {ideaGroup.idea.title}
                              </span>
                            </Link>
                            <span className="hidden">
                              {ideaGroup.idea.status}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">
                              {ideaGroup.comments.length}
                            </span>{' '}
                            comment{ideaGroup.comments.length !== 1 ? 's' : ''}
                          </div>
                        </div>

                        {/* Collapsible section */}
                        <div className="mt-2 space-y-1.5">
                          {/* Idea creator */}
                          {ideaGroup.idea.profile && (
                            <div className="text-xs md:text-sm flex items-center gap-1.5 text-muted-foreground">
                              <span>By</span>
                              <Link
                                href={`/profile/${ideaGroup.idea.profile.discord_username || ideaGroup.idea.profile.id}`}
                                className="font-medium hover:underline inline-flex items-center gap-1"
                              >
                                <Avatar className="h-4 w-4 md:h-5 md:w-5">
                                  <AvatarImage
                                    src={
                                      ideaGroup.idea.profile.avatar_url || ''
                                    }
                                  />
                                  <AvatarFallback className="text-[8px] md:text-[10px]">
                                    {getInitials(
                                      ideaGroup.idea.profile.full_name
                                    )}
                                  </AvatarFallback>
                                </Avatar>
                                {ideaGroup.idea.profile.full_name}
                              </Link>
                            </div>
                          )}

                          {/* Idea description shown in a cleaner way */}
                          {ideaGroup.idea.description && (
                            <div className="text-base text-muted-foreground mt-2">
                              {ideaGroup.idea.description.substring(0, 180)}
                              {ideaGroup.idea.description.length > 180
                                ? '...'
                                : ''}
                            </div>
                          )}
                          
                          {/* Contribution graph for this specific idea */}
                          {ideasContributionsMap[ideaGroup.idea.id] && 
                           ideasContributionsMap[ideaGroup.idea.id].length > 0 && (
                            <div className="w-full overflow-hidden mt-3">
                              <SimpleContributionGraph 
                                data={ideasContributionsMap[ideaGroup.idea.id]}
                                size="xs"
                                showTooltips={true}
                                rightAligned={true}
                                className="justify-end w-full"
                                dense={true}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Simple activity log */}
                    <div className="my-4">
                      {ideaGroup.comments.slice(0, 4).map((comment) => (
                        <div key={comment.id} className="mb-3 last:mb-0">
                          <div className="flex items-start gap-2 relative pl-4">
                            <div className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-muted"></div>
                            {/* Commenter avatar with link */}
                            {comment.profile && (
                              <Link
                                href={`/profile/${comment.profile.discord_username || comment.profile.id}`}
                                className="shrink-0"
                              >
                                <Avatar className="h-6 w-6 md:h-7 md:w-7">
                                  <AvatarImage
                                    src={comment.profile.avatar_url || ''}
                                    alt={comment.profile.full_name || ''}
                                  />
                                  <AvatarFallback className="text-[10px] md:text-[11px]">
                                    {getInitials(comment.profile.full_name)}
                                  </AvatarFallback>
                                </Avatar>
                              </Link>
                            )}

                            <div className="flex-1">
                              <div className="flex items-center gap-x-1.5 text-sm">
                                {/* Commenter name with link */}
                                {comment.profile && (
                                  <Link
                                    href={`/profile/${comment.profile.discord_username || comment.profile.id}`}
                                    className="font-medium text-muted-foreground hover:underline"
                                  >
                                    {comment.profile.full_name}
                                  </Link>
                                )}
                                <span className="text-muted-foreground text-xs">
                                  {formatDistanceToNow(
                                    new Date(comment.created_at),
                                    { addSuffix: true }
                                  )}
                                </span>
                              </div>

                              {/* Comment content */}
                              <div className="mt-1 text-sm">
                                {comment.comment_text}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {ideaGroup.comments.length > 4 && (
                        <Link
                          href={`/ideas/${ideaGroup.idea?.id}`}
                          className="text-primary hover:underline text-sm flex items-center mt-1"
                        >
                          {ideaGroup.comments.length - 4} more comments
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Load more button */}
              <div className="mt-6 flex justify-center">
                <Link href={`/timeline?weeks=${weeksToLoad + 1}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs md:text-sm"
                  >
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Load comments from previous week
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg md:text-xl">
                <Lightbulb className="h-5 w-5 mr-2" />
                Quick Links
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Link
                  href="/ideas"
                  className="block p-3 border rounded-md hover:bg-accent transition-colors"
                >
                  <div className="font-medium text-base md:text-lg">
                    Projects & Ideas
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Browse project ideas or share your own
                  </div>
                </Link>

                <Link
                  href="/demoday"
                  className="block p-3 border rounded-md hover:bg-accent transition-colors"
                >
                  <div className="font-medium text-base md:text-lg">
                    Demoday
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Monthly showcase of ideas and projects
                  </div>
                </Link>

                <Link
                  href="/people"
                  className="block p-3 border rounded-md hover:bg-accent transition-colors"
                >
                  <div className="font-medium text-base md:text-lg">
                    Members Directory
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Find NS members to collaborate with
                  </div>
                </Link>

                <Link
                  href="/profile/me"
                  className="block p-3 border rounded-md hover:bg-accent transition-colors"
                >
                  <div className="font-medium text-base md:text-lg">
                    Your Profile
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Update your skills and information
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Feedback Memo Board */}
          <FeedbackBoard feedbacks={feedbacks} currentUserId={user.id} />
        </div>
      </div>
    </div>
  );
}
