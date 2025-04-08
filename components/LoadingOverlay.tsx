'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * A reusable loading overlay component that can be applied to any container
 * Used to show loading state during form submissions and async operations
 */
export default function LoadingOverlay() {
  return (
    <div className="absolute inset-0 bg-background/70 flex items-center justify-center z-10 rounded-md backdrop-blur-[1px]">
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
    </div>
  );
}
