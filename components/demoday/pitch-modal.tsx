'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
// import { Checkbox } from '@/components/ui/checkbox';
import { createClient } from '@/utils/supabase/client';
import { IDEA_STATUSES, LOOKING_FOR_TAGS } from '@/lib/supabase/types';

// TODO: Use proper types
type Idea = { id: string; title: string };

interface PitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  ideas: Idea[];
  onSubmit: (selectedIdeaId: string) => Promise<void>;
  isSubmitting: boolean;
}

export default function PitchModal({
  isOpen,
  onClose,
  ideas,
  onSubmit,
  isSubmitting,
}: PitchModalProps) {
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [isCreatingIdea, setIsCreatingIdea] = useState(false);
  const [isSavingNewIdea, setIsSavingNewIdea] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedIdeaId(null);
      setIsCreatingIdea(ideas.length === 0);
    }
  }, [isOpen, ideas.length]);

  const handleSubmit = () => {
    if (selectedIdeaId) {
      onSubmit(selectedIdeaId);
    }
  };

  const handleCreateAndSubmitIdea = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setIsSavingNewIdea(true);

    try {
      const formData = new FormData(e.currentTarget);
      const title = formData.get('title') as string;
      const description = formData.get('description') as string;
      const status = formData.get('status') as string;

      // Get looking for tags
      const lookingForTags = LOOKING_FOR_TAGS.filter((tag) =>
        formData.get(`looking-for-${tag.replace(/\s/g, '-').toLowerCase()}`)
      ).map((tag) => tag);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Insert the new idea
      const { data: newIdea, error } = await supabase
        .from('ideas')
        .insert({
          submitter_user_id: user.id,
          title,
          description,
          status,
          looking_for_tags: lookingForTags,
        })
        .select('id')
        .single();

      if (error) throw error;

      // Add creator as a member
      const { error: memberError } = await supabase
        .from('idea_members')
        .insert({
          idea_id: newIdea.id,
          user_id: user.id,
          role: 'Owner',
        });

      if (memberError) throw memberError;

      // Submit the pitch with the new idea
      await onSubmit(newIdea.id);

      // Refresh the router to update the UI
      router.refresh();
    } catch (error) {
      console.error('Error creating and submitting idea:', error);
      setIsSavingNewIdea(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={isCreatingIdea ? 'sm:max-w-[600px]' : 'sm:max-w-[480px]'}
      >
        <DialogHeader>
          <DialogTitle>
            {isCreatingIdea
              ? 'Create New Idea & Pitch'
              : 'Which Idea to Pitch?'}
          </DialogTitle>
          <DialogDescription>
            {isCreatingIdea
              ? "Create a new idea and submit it for this month's Demoday."
              : "Select one of your projects or ideas to submit for this month's Demoday."}
          </DialogDescription>
        </DialogHeader>

        {isCreatingIdea ? (
          <form onSubmit={handleCreateAndSubmitIdea} className="space-y-4 py-4">
            <ScrollArea className="h-[50vh] pr-4">
              <div className="grid gap-4 pb-4 px-2">
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
                    {IDEA_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                {/* <div className="grid gap-2 mt-4">
                  <Label>Looking For</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Select what kind of help or team members you&apos;re looking
                    for
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {LOOKING_FOR_TAGS.map((tag) => {
                      const id = `looking-for-${tag.replace(/\s/g, '-').toLowerCase()}`;

                      return (
                        <div key={id} className="flex items-center space-x-2">
                          <Checkbox
                            id={id}
                            name={`looking-for-${tag.replace(/\s/g, '-').toLowerCase()}`}
                          />
                          <Label htmlFor={id} className="font-normal">
                            {tag}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div> */}
              </div>
            </ScrollArea>

            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSavingNewIdea || isSubmitting}>
                {(isSavingNewIdea || isSubmitting) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Idea & Submit Pitch
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="grid gap-4 py-4">
            {ideas.length === 0 ? (
              <p className="text-sm text-muted-foreground mb-4">
                You don&apos;t have any ideas yet. Create one to pitch at this
                month&apos;s Demoday.
              </p>
            ) : (
              <ScrollArea className="h-[200px] w-full pr-4">
                <RadioGroup
                  value={selectedIdeaId || ''}
                  onValueChange={setSelectedIdeaId}
                  className="grid gap-3"
                >
                  {ideas.map((idea) => (
                    <Label
                      key={idea.id}
                      htmlFor={idea.id}
                      className="flex items-center space-x-3 rounded-md border border-muted bg-transparent p-3 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-muted"
                    >
                      <RadioGroupItem value={idea.id} id={idea.id} />
                      <span className="font-medium truncate">{idea.title}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </ScrollArea>
            )}

            {/* Notice Section */}
            <div className="mt-4 p-3 border rounded-md bg-secondary/30 text-sm text-secondary-foreground">
              <h4 className="font-semibold mb-1.5">Important Notes:</h4>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>
                  Make sure your idea/project is ready for a brief showcase.
                </li>
                <li>Each pitch must conclude within 2 minutes.</li>
                <li>There is no Q&A session on stage during Demoday.</li>
                <li>You can only submit one pitch per month.</li>
              </ul>
            </div>
          </div>
        )}

        {!isCreatingIdea && (
          <DialogFooter className="sm:justify-between gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            {ideas.length === 0 ? (
              <Button type="button" onClick={() => setIsCreatingIdea(true)}>
                Create New Idea
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!selectedIdeaId || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Submit Pitch
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
