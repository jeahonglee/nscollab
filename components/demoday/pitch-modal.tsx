'use client';

import { useState, useEffect } from 'react';
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

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedIdeaId(null);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (selectedIdeaId) {
      onSubmit(selectedIdeaId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Which Idea to Pitch?</DialogTitle>
          <DialogDescription>
            Select one of your projects or ideas to submit for this month's Demoday.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {ideas.length === 0 ? (
            <p className="text-center text-muted-foreground italic">
              You don't seem to have any projects/ideas yet. Go add one first!
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
              <li>Make sure your idea/project is ready for a brief showcase.</li>
              <li>Each pitch must conclude within 2 minutes.</li>
              <li>There is no Q&A session on stage during Demoday.</li>
              <li>You can only submit one pitch per month.</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="sm:justify-between gap-2">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedIdeaId || isSubmitting || ideas.length === 0}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Submit Pitch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
