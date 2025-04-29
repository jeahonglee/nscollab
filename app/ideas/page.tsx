import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IdeaCard } from '@/components/ideas/idea-card';
import { IdeaWithRelations } from '@/lib/supabase/types';
import { IDEA_STATUSES } from '@/lib/supabase/types';
import { Plus } from 'lucide-react';
import { getAllIdeasContributions } from '@/app/actions/contributionActions';
import { cache } from 'react';

// Create a cached version of the ideas fetch to avoid redundant calls
const getIdeas = cache(async (statusFilter: string) => {
  const supabase = await createClient();
  
  // Build query
  let query = supabase
    .from('ideas')
    .select(
      `
      *,
      profile: profiles!ideas_submitter_user_id_fkey (
        id, full_name, avatar_url
      ),
      members: idea_members (
        id, user_id, role,
        profile: profiles (
          id, full_name, avatar_url
        )
      )
    `
    )
    .eq('is_archived', false);

  // Apply status filter if present
  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }

  // Always sort by most recent activity
  query = query.order('last_activity_at', { ascending: false });

  // Execute query
  const { data: ideas, error } = await query;

  if (error) {
    console.error('Error fetching ideas:', error);
    return [];
  }

  return ideas as IdeaWithRelations[];
});

export default async function IdeasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/sign-in');
  }

  // Get filter parameter
  const statusFilter = (await searchParams).status || '';

  // Get ideas with caching
  const ideasList = await getIdeas(statusFilter);
  
  // Fetch contribution data for all ideas (this is already cached in the updated contributionActions.ts)
  const contributionsMap = await getAllIdeasContributions();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Projects & Ideas</h1>
          <p className="text-muted-foreground">
            Discover project ideas from NS members or share your own
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/ideas/new">
              <Plus className="h-4 w-4 mr-2" />
              New
            </Link>
          </Button>
        </div>
      </div>

      {/* Status filter badges */}
      <div className="flex flex-wrap gap-2 mb-6">
        {statusFilter && (
          <Badge variant="secondary" className="gap-1">
            {statusFilter}
            <Link
              href="/ideas"
              className="ml-1 hover:text-destructive"
              aria-label="Remove status filter"
            >
              ×
            </Link>
          </Badge>
        )}

        {!statusFilter &&
          IDEA_STATUSES.map((status) => (
            <a
              key={status}
              href={`/ideas?status=${encodeURIComponent(status)}`}
            >
              <Badge
                variant="outline"
                className="hover:bg-accent cursor-pointer"
              >
                {status}
              </Badge>
            </a>
          ))}
      </div>

      {/* Ideas list */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ideasList.map((idea) => (
            <IdeaCard 
              key={idea.id} 
              idea={idea} 
              contributionData={contributionsMap[idea.id] || []}
            />
          ))}
        </div>

        {ideasList.length === 0 && (
          <div className="text-center p-12 border rounded-lg">
            <h3 className="text-lg font-medium">No ideas yet</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to share a project idea with the community!
            </p>
            <Button asChild>
              <Link href="/ideas/new">
                <Plus className="h-4 w-4 mr-2" />
                New Idea
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
