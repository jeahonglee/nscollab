'use client';

import { User } from '@supabase/supabase-js';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { IDEA_STATUSES, LOOKING_FOR_TAGS } from '@/lib/supabase/types';
import { submitIdea } from '@/lib/idea-submit-actions';
import { LoadingOverlay } from '@/components/ui/loading-overlay';

interface IdeaFormProps {
  user: User;
}

export function IdeaForm({ user }: IdeaFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  return (
    <Card>
      <LoadingOverlay
        isLoading={isSubmitting}
        loadingText="Submitting idea..."
      />
      <CardContent className="pt-6">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setIsSubmitting(true);
            try {
              const formData = new FormData(e.currentTarget);
              const ideaId = await submitIdea(formData, user.id);
              // Don't reset loading state before redirect
              // This maintains loading overlay during navigation
              router.push(`/ideas/${ideaId}`);
              return; // Skip the finally block
            } catch (error) {
              console.error('Error submitting idea:', error);
              // Only reset loading state if there was an error
              setIsSubmitting(false);
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
                        name={`looking-for-${tag.replace(/\s/g, '-').toLowerCase()}`}
                      />
                      <Label htmlFor={id} className="font-normal">
                        {tag}
                      </Label>
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Idea'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
