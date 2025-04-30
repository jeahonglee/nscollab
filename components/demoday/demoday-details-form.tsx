'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DemodayDetails } from '@/types/demoday';

interface DemodayDetailsFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialDetails: DemodayDetails;
  onSubmit: (details: DemodayDetails) => Promise<void>;
  isSubmitting: boolean;
}

export default function DemodayDetailsForm({
  isOpen,
  onClose,
  initialDetails,
  onSubmit,
  isSubmitting,
}: DemodayDetailsFormProps) {
  const [details, setDetails] = useState<DemodayDetails>({
    when: initialDetails?.when || '',
    where: initialDetails?.where || '',
    what: initialDetails?.what || '',
    luma_url: initialDetails?.luma_url || '',
  });

  const handleChange = (field: keyof DemodayDetails, value: string) => {
    setDetails((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(details);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Set Demoday Details</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="when">When</Label>
            <Input
              id="when"
              value={details.when || ''}
              onChange={(e) => handleChange('when', e.target.value)}
              placeholder="e.g., May 15th, 2025 at 3:00 PM PST"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="where">Where</Label>
            <Input
              id="where"
              value={details.where || ''}
              onChange={(e) => handleChange('where', e.target.value)}
              placeholder="e.g., Zoom, Discord, or physical location"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="what">What</Label>
            <Textarea
              id="what"
              value={details.what || ''}
              onChange={(e) => handleChange('what', e.target.value)}
              placeholder="Brief description of this month's demoday theme or focus"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="luma_url">Luma Event URL</Label>
            <Input
              id="luma_url"
              value={details.luma_url || ''}
              onChange={(e) => handleChange('luma_url', e.target.value)}
              placeholder="https://lu.ma/event/..."
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Details'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
