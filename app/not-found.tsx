'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Component with hooks that needs Suspense
function NotFoundContent() {
  const router = useRouter();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <h1 className="text-5xl font-bold mb-6">404</h1>
      <h2 className="text-2xl font-medium mb-6">Page Not Found</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved to a different location.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
        >
          Go Back
        </button>
        <Link
          href="/"
          className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}

export default function NotFound() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <h1 className="text-5xl font-bold mb-6">404</h1>
        <h2 className="text-2xl font-medium mb-6">Page Not Found</h2>
        <div className="animate-pulse h-48 w-full max-w-md bg-muted rounded-lg"></div>
      </div>
    }>
      <NotFoundContent />
    </Suspense>
  );
}
