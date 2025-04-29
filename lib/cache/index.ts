import { unstable_cache } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

// Cache durations in seconds
export const CACHE_TIMES = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 1800, // 30 minutes
  VERY_LONG: 3600, // 1 hour
};

/**
 * Creates a cached Supabase query function with proper revalidation
 *
 * @param queryFn Function that makes the actual Supabase query
 * @param cacheKey Array of strings for the cache key
 * @param revalidate How often to revalidate the cache in seconds
 * @returns Cached response data
 */
export async function createCachedQuery<T>(
  queryFn: (supabase: Awaited<ReturnType<typeof createClient>>) => Promise<T>,
  cacheKey: string[],
  revalidate = CACHE_TIMES.MEDIUM
): Promise<T> {
  // Create Supabase client OUTSIDE the cache function
  const supabase = await createClient();

  // Wrap the query in a cache
  return unstable_cache(
    async () => {
      return await queryFn(supabase);
    },
    cacheKey,
    { revalidate }
  )();
}

/**
 * Utility for creating parameterized cached queries
 *
 * @param queryFn Function that accepts a parameter and Supabase client
 * @param cacheKeyPrefix Prefix for the cache key
 * @param revalidate How often to revalidate the cache in seconds
 * @returns A function that accepts a parameter and returns cached data
 */
export function createParameterizedCachedQuery<P, T>(
  queryFn: (
    param: P,
    supabase: Awaited<ReturnType<typeof createClient>>
  ) => Promise<T>,
  cacheKeyPrefix: string,
  revalidate = CACHE_TIMES.MEDIUM
): (param: P) => Promise<T> {
  return async (param: P) => {
    const supabase = await createClient();

    // Generate a string representation of the parameter for the cache key
    const paramKey = JSON.stringify(param);

    return unstable_cache(
      async () => {
        return await queryFn(param, supabase);
      },
      [`${cacheKeyPrefix}-${paramKey}`],
      { revalidate }
    )();
  };
}
