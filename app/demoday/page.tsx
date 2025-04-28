import { Suspense } from 'react';
import { createClient } from '@/utils/supabase/server';
import DemodayContent from '@/components/demoday/demoday-content';
import { Separator } from '@/components/ui/separator';

// Revalidate this page every hour to potentially show new upcoming months
export const revalidate = 3600;

export default async function DemodayPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">NS Demoday</h1>
        <p className="text-muted-foreground">
          Monthly showcase of ideas and projects from Network School members.
        </p>
      </div>
      <Separator />

      <Suspense fallback={<DemodayLoadingSkeleton />}>
        <DemodayContent serverUser={user} />
      </Suspense>
    </div>
  );
}

// Simple loading skeleton
function DemodayLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {/* Skeleton for tabs */}
      <div className="flex space-x-2 border-b">
        <div className="h-10 w-24 bg-muted rounded-t-md animate-pulse"></div>
        <div className="h-10 w-24 bg-muted/50 rounded-t-md animate-pulse"></div>
        <div className="h-10 w-24 bg-muted/50 rounded-t-md animate-pulse"></div>
      </div>
      {/* Skeleton for pitch list */}
      <div className="space-y-3">
        <div className="h-16 w-full bg-muted rounded-md animate-pulse"></div>
        <div className="h-16 w-full bg-muted rounded-md animate-pulse"></div>
        <div className="h-16 w-full bg-muted rounded-md animate-pulse"></div>
      </div>
      {/* Skeleton for button */}
      <div className="h-10 w-36 bg-muted rounded-md animate-pulse mt-4"></div>
    </div>
  );
}
