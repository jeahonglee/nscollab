"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { IDEA_STATUSES, LOOKING_FOR_TAGS, IdeaWithRelations } from '@/lib/supabase/types';
// Import the server action from idea-actions.ts
import { updateIdea as updateIdeaAction } from '@/lib/idea-actions';

// Type for looking_for_tags (derived from const array)
type LookingForTag = typeof LOOKING_FOR_TAGS[number];

interface IdeaEditFormProps {
  idea: IdeaWithRelations;
}

export function IdeaEditForm({ idea }: IdeaEditFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Client-side wrapper for the server action
  async function handleUpdateIdea(formData: FormData) {
    try {
      setIsLoading(true);
      await updateIdeaAction(formData, idea.id);
      router.refresh();
    } catch (error) {
      console.error('Error updating idea:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <LoadingOverlay isLoading={isLoading} loadingText="Saving changes..." />
        <form 
          onSubmit={async (e) => {
            e.preventDefault();
            setIsLoading(true);
            try {
              const formData = new FormData(e.currentTarget);
              await updateIdeaAction(formData, idea.id);
              // Redirect back to the idea detail page
              // Don't reset loading state before redirect
              router.push(`/ideas/${idea.id}`);
              return; // Skip the finally block
            } catch (error) {
              console.error('Error updating idea:', error);
              // Only reset loading state if there was an error
              setIsLoading(false);
            }
          }} 
          className="space-y-6"
        >
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
                Select what kind of help or team members you&apos;re looking for
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {LOOKING_FOR_TAGS.map((tag) => {
                  const id = `looking-for-${tag.replace(/\s/g, '-').toLowerCase()}`;
                  const isChecked = idea.looking_for_tags?.includes(tag) || false;
                  
                  return (
                    <div key={id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={id} 
                        name={`looking-for-${tag.replace(/\s/g, '-').toLowerCase()}`}
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
              <Link href={`/ideas/${idea.id}`}>Cancel</Link>
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
