'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface DemodayDetailsFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialDetails?: Record<string, unknown>;
  onSubmit: (details: Record<string, unknown>) => void;
  isSubmitting: boolean;
}

export default function DemodayDetailsForm({
  isOpen,
  onClose,
  initialDetails,
  onSubmit,
  isSubmitting,
}: DemodayDetailsFormProps) {
  const [formData, setFormData] = useState({
    when: (initialDetails?.when as string) || '',
    where: (initialDetails?.where as string) || '',
    what: (initialDetails?.what as string) || '',
    luma_url: (initialDetails?.luma_url as string) || '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Demoday Details</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="when" className="text-right">
                When
              </Label>
              <Input
                id="when"
                name="when"
                value={formData.when}
                onChange={handleChange}
                placeholder="e.g., September 30th at 7pm ET"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="where" className="text-right">
                Where
              </Label>
              <Input
                id="where"
                name="where"
                value={formData.where}
                onChange={handleChange}
                placeholder="e.g., Discord Voice Channel or Zoom"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="what" className="text-right pt-2">
                Description
              </Label>
              <Textarea
                id="what"
                name="what"
                value={formData.what}
                onChange={handleChange}
                placeholder="Describe what will happen at this demoday..."
                className="col-span-3"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="luma_url" className="text-right">
                Luma URL
              </Label>
              <Input
                id="luma_url"
                name="luma_url"
                value={formData.luma_url}
                onChange={handleChange}
                placeholder="https://lu.ma/event/..."
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Details'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
