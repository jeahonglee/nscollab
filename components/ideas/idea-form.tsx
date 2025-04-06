import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { IDEA_STATUSES, LOOKING_FOR_TAGS } from '@/lib/supabase/types';

interface IdeaFormProps {
  user: User;
}

export function IdeaForm({ user }: IdeaFormProps) {
  // Server action to submit a new idea
  async function submitIdea(formData: FormData) {
    'use server';
    
    const supabase = await createClient();
    
    // Get form data
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const status = formData.get('status') as string;
    
    // Get looking_for tags
    const lookingForTags = LOOKING_FOR_TAGS.filter(tag => 
      formData.get(`looking-for-${tag.replace(/\s/g, '-').toLowerCase()}`) === 'on'
    );
    
    // Create idea in database
    const { data: idea, error } = await supabase
      .from('ideas')
      .insert({
        submitter_user_id: user.id,
        title,
        description,
        status,
        looking_for_tags: lookingForTags.length > 0 ? lookingForTags : null,
        is_archived: false,
        last_activity_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error submitting idea:', error);
      // Handle error (in a real app, you'd want to display this to the user)
      return;
    }
    
    // Add the creator as the first team member with "Owner" role
    const { error: memberError } = await supabase
      .from('idea_members')
      .insert({
        idea_id: idea.id,
        user_id: user.id,
        role: 'Owner',
      });
    
    if (memberError) {
      console.error('Error adding owner to idea:', memberError);
    }
    
    // Add a welcome comment
    const { error: commentError } = await supabase
      .from('idea_comments')
      .insert({
        idea_id: idea.id,
        user_id: user.id,
        comment_text: '🚀 Created this idea! Looking forward to making it happen.',
      });
    
    if (commentError) {
      console.error('Error adding welcome comment:', commentError);
    }
    
    revalidatePath('/ideas');
    redirect(`/ideas/${idea.id}`);
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={submitIdea} className="space-y-6">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Idea Title</Label>
              <Input 
                id="title" 
                name="title" 
                placeholder="Give your idea a clear, concise title"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                name="description" 
                placeholder="Describe your idea. What problem does it solve? Who is it for? How would you build it?"
                required
                rows={5}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="status">Current Status</Label>
              <select 
                id="status"
                name="status"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                defaultValue={IDEA_STATUSES[0]}
              >
                {IDEA_STATUSES.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            
            <div className="grid gap-2 mt-4">
              <Label>Looking For</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Select what kind of help or team members you&apos;re looking for
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {LOOKING_FOR_TAGS.map((tag) => {
                  const id = `looking-for-${tag.replace(/\s/g, '-').toLowerCase()}`;
                  
                  return (
                    <div key={id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={id} 
                        name={id}
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
              <Link href="/ideas">Cancel</Link>
            </Button>
            <Button type="submit">Submit Idea</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
