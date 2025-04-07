'use client';

import { useState } from 'react';
import { Loader2, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteIdeaAction } from '@/app/actions';
import { useRouter } from 'next/navigation';

interface DeleteIdeaButtonProps {
  ideaId: string;
}

export function DeleteIdeaButton({ ideaId }: DeleteIdeaButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteIdeaAction(ideaId);

      if (result.success) {
        // Don't reset the loading state before redirect
        // This ensures the button stays in loading state during navigation
        router.push('/ideas');
        return; // Skip the finally block
      } else {
        setError(result.error || 'Failed to delete idea');
        setIsConfirming(false);
      }
    } catch (err) {
      console.error('Error deleting idea:', err);
      setError('An unexpected error occurred');
    }
    
    // Only reset loading state if we didn't redirect
    setIsDeleting(false);
  };

  if (isConfirming) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Deleting...
            </>
          ) : (
            'Confirm Delete'
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsConfirming(false)}
          disabled={isDeleting}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="default"
        onClick={() => setIsConfirming(true)}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash className="h-4 w-4 mr-2" />
        Delete
      </Button>
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </>
  );
}
