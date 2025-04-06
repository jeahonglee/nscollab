import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { IdeaCard } from '@/components/ideas/idea-card';
import { IdeaWithRelations } from '@/lib/supabase/types';
import { IDEA_STATUSES } from '@/lib/supabase/types';
import { Plus, Filter } from 'lucide-react';

export default async function IdeasPage() {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/sign-in');
  }
  
  // Fetch ideas with submitter profiles
  const { data: ideas, error } = await supabase
    .from('ideas')
    .select(`
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
    `)
    .eq('is_archived', false)
    .order('last_activity_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching ideas:', error);
  }
  
  // Group ideas by status
  const ideaGroups: Record<string, IdeaWithRelations[]> = {};
  IDEA_STATUSES.forEach(status => {
    ideaGroups[status] = [];
  });

  // Fill groups with ideas
  ideas?.forEach(idea => {
    const status = idea.status as string;
    if (ideaGroups[status]) {
      ideaGroups[status].push(idea as IdeaWithRelations);
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Idea Hub</h1>
          <p className="text-muted-foreground">
            Discover project ideas from NS members or share your own
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button asChild>
            <Link href="/ideas/new">
              <Plus className="h-4 w-4 mr-2" />
              New Idea
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="space-y-8">
        {IDEA_STATUSES.map(status => {
          // Skip empty groups
          if (ideaGroups[status]?.length === 0) return null;
          
          return (
            <div key={status} className="space-y-4">
              <h2 className="text-xl font-semibold">{status}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ideaGroups[status]?.map(idea => (
                  <IdeaCard key={idea.id} idea={idea} />
                ))}
              </div>
            </div>
          );
        })}
        
        {Object.values(ideaGroups).flat().length === 0 && (
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
