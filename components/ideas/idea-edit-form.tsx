import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { IDEA_STATUSES, LOOKING_FOR_TAGS, IdeaWithRelations } from '@/lib/supabase/types';

// Type for looking_for_tags (derived from const array)
type LookingForTag = typeof LOOKING_FOR_TAGS[number];

interface IdeaEditFormProps {
  idea: IdeaWithRelations;
}

export function IdeaEditForm({ idea }: IdeaEditFormProps) {
  // Server action to update an existing idea
  async function updateIdea(formData: FormData) {
    'use server';
    
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      redirect('/sign-in');
    }
    
    // First, fetch the current idea to ensure we only update changed fields
    const { data: currentIdea, error: fetchError } = await supabase
      .from('ideas')
      .select('*')
      .eq('id', idea.id)
      .single();

    if (fetchError) {
      console.error('Error fetching current idea data:', fetchError);
      return;
    }
    
    // Create an update object for only changed fields
    const updateData: Record<string, any> = {};
    
    // Track changes for comment
    const changes: string[] = [];
    
    // Only update fields that are present in the form
    if (formData.has('title')) {
      const newTitle = formData.get('title') as string;
      if (newTitle !== currentIdea.title) {
        updateData.title = newTitle;
        changes.push(`Changed title from "${currentIdea.title}" to "${newTitle}"`);
      }
    }
    
    if (formData.has('description')) {
      const newDescription = formData.get('description') as string;
      if (newDescription !== currentIdea.description) {
        updateData.description = newDescription;
        changes.push(`Updated description`);
      }
    }
    
    if (formData.has('status')) {
      const newStatus = formData.get('status') as string;
      if (newStatus !== currentIdea.status) {
        updateData.status = newStatus;
        changes.push(`Changed status from "${currentIdea.status}" to "${newStatus}"`);
      }
    }
    
    // Handle looking_for_tags field
    const lookingForTags = LOOKING_FOR_TAGS.filter((tag: LookingForTag) => 
      formData.get(`looking-for-${tag.replace(/\s/g, '-').toLowerCase()}`) === 'on'
    );
    
    // Only update if the form has looking_for_tags checkboxes
    if (LOOKING_FOR_TAGS.some((tag: LookingForTag) => formData.has(`looking-for-${tag.replace(/\s/g, '-').toLowerCase()}`))) {
      const oldTags = currentIdea.looking_for_tags || [];
      const newTags = lookingForTags.length > 0 ? lookingForTags : [];
      
      // Check if tags have changed
      if (JSON.stringify(oldTags.sort()) !== JSON.stringify(newTags.sort())) {
        updateData.looking_for_tags = newTags.length > 0 ? newTags : null;
        
        // Generate a meaningful change message about tags
        if (oldTags.length === 0 && newTags.length > 0) {
          changes.push(`Added looking for tags: ${newTags.join(', ')}`);
        } else if (oldTags.length > 0 && newTags.length === 0) {
          changes.push(`Removed all looking for tags`);
        } else {
          // Find added and removed tags
          const added = newTags.filter((tag: LookingForTag) => !oldTags.includes(tag));
          const removed = oldTags.filter((tag: LookingForTag) => !newTags.includes(tag));
          
          if (added.length > 0) {
            changes.push(`Added tags: ${added.join(', ')}`);
          }
          if (removed.length > 0) {
            changes.push(`Removed tags: ${removed.join(', ')}`);
          }
        }
      }
    }
    
    // Update last_activity_at timestamp
    updateData.updated_at = new Date().toISOString();
    updateData.last_activity_at = new Date().toISOString();
    
    // Only proceed with update if there are changes
    if (Object.keys(updateData).length === 0 || (Object.keys(updateData).length === 2 && updateData.updated_at && updateData.last_activity_at)) {
      // No changes to save, redirect back to idea page
      redirect(`/ideas/${idea.id}`);
      return;
    }
    
    // Update idea in database with only the changed fields
    const { error: updateError } = await supabase
      .from('ideas')
      .update(updateData)
      .eq('id', idea.id);
    
    if (updateError) {
      console.error('Error updating idea:', updateError);
      // Handle error (in a real app, you'd want to display this to the user)
      return;
    }
    
    // Add a comment with the changes made
    if (changes.length > 0) {
      const commentText = `📝 Updated the idea:\n${changes.map(change => `- ${change}`).join('\n')}`;
      
      const { error: commentError } = await supabase
        .from('idea_comments')
        .insert({
          idea_id: idea.id,
          user_id: user.id,
          comment_text: commentText,
        });
      
      if (commentError) {
        console.error('Error adding update comment:', commentError);
      }
    }
    
    // Revalidate paths to update the UI
    revalidatePath(`/ideas/${idea.id}`);
    revalidatePath('/ideas');
    
    // Redirect back to idea page
    redirect(`/ideas/${idea.id}`);
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={updateIdea} className="space-y-6">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Idea Title</Label>
              <Input 
                id="title" 
                name="title" 
                defaultValue={idea.title}
                placeholder="Give your idea a clear, concise title"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                name="description" 
                defaultValue={idea.description}
                placeholder="Describe your idea. What problem does it solve? Who is it for? How would you build it?"
                required
                rows={8}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="status">Current Status</Label>
              <select 
                id="status"
                name="status"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                defaultValue={idea.status}
              >
                {IDEA_STATUSES.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            
            <div className="grid gap-2 mt-4">
              <Label>Looking For</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Select what kind of help or team members you're looking for
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {LOOKING_FOR_TAGS.map((tag) => {
                  const id = `looking-for-${tag.replace(/\s/g, '-').toLowerCase()}`;
                  const isChecked = idea.looking_for_tags?.includes(tag) || false;
                  
                  return (
                    <div key={id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={id} 
                        name={id}
                        defaultChecked={isChecked}
                      />
                      <Label htmlFor={id} className="font-normal">{tag}</Label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" asChild>
              <a href={`/ideas/${idea.id}`}>Cancel</a>
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
