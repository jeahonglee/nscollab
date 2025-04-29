# Caching Strategy in NS Collab

This document outlines the caching strategy implemented in the NS Collab application to optimize performance, reduce database load, and improve user experience.

## Overview

We've implemented a multi-layered caching approach using Next.js 15's built-in caching mechanisms:

1. **Router Cache**: Next.js automatically caches React Server Component payloads client-side
2. **Data Cache**: Custom implementation using `unstable_cache` for database queries
3. **Partial Rendering**: Next.js only re-renders the parts of the page that change

## Caching Implementation

### Router Cache (Automatic)

Next.js automatically implements an in-memory client-side cache called the Router Cache. This stores React Server Component payloads for prefetched and visited routes, reducing redundant server requests during navigation.

### Data Cache (Custom)

We've implemented a custom data caching layer in `lib/cache/` with the following components:

#### Core Utilities (`lib/cache/index.ts`)

- **Cache Duration Constants**: Predefined cache durations (SHORT: 60s, MEDIUM: 300s, LONG: 1800s, VERY_LONG: 3600s)
- **createCachedQuery**: Creates a cached Supabase query with proper revalidation
- **createParameterizedCachedQuery**: Creates parameterized cached queries for filtered data

#### Cached Queries (`lib/cache/queries.ts`)

Pre-defined cached query functions for common database operations:

- `getIdeasWithCache`: Fetches ideas with optional status filtering
- `getIdeaByIdWithCache`: Fetches a single idea by ID
- `getProfilesWithCache`: Fetches profiles with optional tag filtering
- `getRecentCommentsWithCache`: Fetches recent comments for the timeline
- `getFeedbacksWithCache`: Fetches feedbacks for the feedback board

#### Server Actions (`app/actions/contributionActions.ts`)

Server actions with built-in caching for fetching contribution data:

- `getUserContributions`: Fetches a user's contribution data with 5-minute cache
- `getIdeaContributions`: Fetches an idea's contribution data with 5-minute cache
- `getAllIdeasContributions`: Fetches all ideas' contributions with 5-minute cache
- `getAllUsersContributions`: Fetches all users' contributions with 5-minute cache

## Cache Invalidation

Caches are automatically invalidated based on their revalidation time:

- **SHORT (60s)**: For frequently changing data like comments and activities
- **MEDIUM (300s)**: For moderately changing data like ideas and profiles
- **LONG (1800s)**: For infrequently changing data
- **VERY_LONG (3600s)**: For rarely changing data

## Benefits

1. **Improved Performance**: Reduced loading times and smoother navigation
2. **Reduced Database Load**: Fewer redundant queries to Supabase
3. **Better User Experience**: Pages load faster, especially during navigation
4. **Reduced Costs**: Fewer database operations mean lower infrastructure costs

## Implementation in Pages

The caching strategy has been implemented in the main pages:

- `app/timeline/page.tsx`: Uses `getRecentCommentsWithCache` and `getFeedbacksWithCache`
- `app/ideas/page.tsx`: Uses `getIdeasWithCache`
- `app/people/page.tsx`: Uses `getProfilesWithCache`

## Best Practices

1. **Choose appropriate cache durations** based on how frequently data changes
2. **Use parameterized queries** when filtering data to maintain cache efficiency
3. **Implement proper error handling** within cached functions
4. **Create Supabase clients outside of cache functions** to avoid connection issues
