'use client';

import { useRoutePrefetch } from '@/lib/route-cache';

export default function RouteCacheProvider() {
  // This component doesn't render anything visible
  // It just hooks into our route prefetching system
  useRoutePrefetch();
  
  return null;
}
