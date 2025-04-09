'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

type RouteCache = {
  [path: string]: {
    html?: string;
    timestamp: number;
  };
};

const MAX_CACHE_SIZE = 20;
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const routeCache: RouteCache = {};

// Clean up old cache entries
function cleanupCache() {
  const now = Date.now();
  const entries = Object.entries(routeCache);
  
  // Remove expired entries
  entries.forEach(([path, data]) => {
    if (now - data.timestamp > CACHE_EXPIRY_MS) {
      delete routeCache[path];
    }
  });
  
  // If still over max size, remove oldest entries
  if (Object.keys(routeCache).length > MAX_CACHE_SIZE) {
    const sortedEntries = entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = sortedEntries.slice(0, sortedEntries.length - MAX_CACHE_SIZE);
    toRemove.forEach(([path]) => {
      delete routeCache[path];
    });
  }
}

// Hook to automatically prefetch likely navigation paths
export function useRoutePrefetch() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPathRef = useRef<string | null>(null);
  
  // Generate the full path including search params
  const fullPath = searchParams?.size 
    ? `${pathname}?${searchParams.toString()}`
    : pathname;

  useEffect(() => {
    // Don't prefetch during the initial render
    if (lastPathRef.current === null) {
      lastPathRef.current = fullPath;
      return;
    }
    
    // Add the current path to cache
    routeCache[fullPath] = {
      timestamp: Date.now()
    };
    
    // Cleanup old cache entries
    cleanupCache();
    
    // Update last path
    lastPathRef.current = fullPath;
    
    // Prefetch likely next paths
    const prefetchPaths = getLikelyNextPaths(pathname);
    prefetchPaths.forEach(path => {
      if (typeof window !== 'undefined') {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = path;
        link.as = 'document';
        document.head.appendChild(link);
        
        // Clean up after 3 seconds
        setTimeout(() => {
          document.head.removeChild(link);
        }, 3000);
      }
    });
  }, [pathname, fullPath]);
  
  return null;
}

// Predict likely next navigation paths based on current path
function getLikelyNextPaths(currentPath: string): string[] {
  const prefetchPaths: string[] = [];
  
  // Common navigation paths
  prefetchPaths.push('/');
  prefetchPaths.push('/people');
  prefetchPaths.push('/ideas');
  
  // Ideas-specific navigation
  if (currentPath === '/ideas') {
    // Fetch recent idea IDs from localStorage if available
    const recentIds = getRecentIdsFromStorage('recentIdeas');
    recentIds.forEach(id => {
      prefetchPaths.push(`/ideas/${id}`);
    });
    prefetchPaths.push('/ideas/new');
  }
  
  // People-specific navigation
  if (currentPath === '/people') {
    // Fetch recent profile IDs from localStorage if available
    const recentIds = getRecentIdsFromStorage('recentProfiles');
    recentIds.forEach(id => {
      prefetchPaths.push(`/profile/${id}`);
    });
  }
  
  // Filter out the current path
  return prefetchPaths.filter(path => path !== currentPath);
}

// Helper to get recent IDs from localStorage
function getRecentIdsFromStorage(key: string): string[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to parse localStorage data:', e);
    return [];
  }
}

// Helper to track recently viewed items
export function trackRecentItem(type: 'ideas' | 'profiles', id: string) {
  if (typeof window === 'undefined') return;
  
  const storageKey = type === 'ideas' ? 'recentIdeas' : 'recentProfiles';
  
  try {
    // Get existing items
    const stored = localStorage.getItem(storageKey);
    let items: string[] = stored ? JSON.parse(stored) : [];
    
    // Add new item and ensure uniqueness
    items = [id, ...items.filter(existingId => existingId !== id)];
    
    // Limit size
    if (items.length > 10) {
      items = items.slice(0, 10);
    }
    
    // Save back to storage
    localStorage.setItem(storageKey, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to update localStorage:', e);
  }
}
