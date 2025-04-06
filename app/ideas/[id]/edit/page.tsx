import { createClient } from '@/utils/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { IdeaWithRelations } from '@/lib/supabase/types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { IdeaEditForm } from '@/components/ideas/idea-edit-form';

export default async function EditIdeaPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/sign-in');
  }
  
  // Parse the params
  const { id } = await params;
  
  // Fetch the idea with submitter profile and members
  const { data: idea, error } = await supabase
    .from('ideas')
    .select(`
      *,
      profile: profiles!ideas_submitter_user_id_fkey (
        id, full_name
      ),
      members: idea_members (
        id, user_id, role
      )
    `)
    .eq('id', id)
    .single();
  
  if (error || !idea) {
    console.error('Error fetching idea:', error);
    notFound();
  }
  
  const ideaWithRelations = idea as IdeaWithRelations;
  
  // Check if user is authorized to edit this idea (must be a team member with Owner role)
  const isOwner = ideaWithRelations.members?.some(
    member => member.user_id === user.id && member.role === 'Owner'
  );
  
  if (!isOwner) {
    // User is not authorized to edit this idea
    redirect(`/ideas/${id}`);
  }
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <Link href={`/ideas/${id}`} className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Idea
        </Link>
        
        <h1 className="text-3xl font-bold mb-2">Edit Idea</h1>
        <p className="text-muted-foreground mb-6">
          Update your idea's details, status, and requirements.
        </p>
        
        <IdeaEditForm idea={ideaWithRelations} />
      </div>
    </div>
  );
}
