'use server';

import { createClient } from '@/utils/supabase/server';
import { unstable_cache as cache } from 'next/cache';

interface ContributionData {
  date: string; // YYYY-MM-DD
  count: number;
}

// This is a helper type for our database schemas
type DbClient = ReturnType<typeof createClient> extends Promise<infer T> ? T : never;



// Fetch user contributions - accepts a pre-created Supabase client
async function getUserContributionsData(
  supabase: DbClient,
  userId: string
): Promise<ContributionData[]> {
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const oneYearAgo = new Date(todayEnd);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const { data, error } = await supabase
    .from('idea_comments')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', oneYearAgo.toISOString())
    .lte('created_at', todayEnd.toISOString());

  if (error) {
    console.error('Error fetching user contributions:', error);
    return [];
  }

  // Process data to count comments per day
  const counts: { [date: string]: number } = {};
  data.forEach(comment => {
    const date = new Date(comment.created_at).toISOString().split('T')[0];
    counts[date] = (counts[date] || 0) + 1;
  });

  return Object.entries(counts).map(([date, count]) => ({
    date,
    count,
  }));
}


// Fetch idea contributions - accepts a pre-created Supabase client
async function getIdeaContributionsData(
  supabase: DbClient,
  ideaId: string
): Promise<ContributionData[]> {
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const oneYearAgo = new Date(todayEnd);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const { data, error } = await supabase
    .from('idea_comments')
    .select('created_at')
    .eq('idea_id', ideaId)
    .gte('created_at', oneYearAgo.toISOString())
    .lte('created_at', todayEnd.toISOString());

  if (error) {
    console.error('Error fetching idea contributions:', error);
    return [];
  }

  // Process data to count comments per day
  const counts: { [date: string]: number } = {};
  data.forEach(comment => {
    const date = new Date(comment.created_at).toISOString().split('T')[0];
    counts[date] = (counts[date] || 0) + 1;
  });

  return Object.entries(counts).map(([date, count]) => ({
    date,
    count,
  }));
}

// Fetch all ideas contributions - accepts a pre-created Supabase client
async function getAllIdeasContributionsData(
  supabase: DbClient
): Promise<Record<string, ContributionData[]>> {
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const ninetyDaysAgo = new Date(todayEnd);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  
  const { data, error } = await supabase
    .from('idea_comments')
    .select('idea_id, created_at')
    .gte('created_at', ninetyDaysAgo.toISOString())
    .lte('created_at', todayEnd.toISOString());
    
  if (error) {
    console.error('Error fetching all ideas contributions:', error);
    return {};
  }
  
  // Group contributions by idea_id
  const contributionsByIdea: Record<string, {[date: string]: number}> = {};
  
  data.forEach(comment => {
    const { idea_id, created_at } = comment;
    const date = new Date(created_at).toISOString().split('T')[0];
    
    if (!contributionsByIdea[idea_id]) {
      contributionsByIdea[idea_id] = {};
    }
    
    contributionsByIdea[idea_id][date] = (contributionsByIdea[idea_id][date] || 0) + 1;
  });
  
  // Convert to the expected format
  const result: Record<string, ContributionData[]> = {};
  
  Object.entries(contributionsByIdea).forEach(([ideaId, counts]) => {
    result[ideaId] = Object.entries(counts).map(([date, count]) => ({
      date,
      count,
    }));
  });
  
  return result;
}

// Fetch all users contributions - accepts a pre-created Supabase client
async function getAllUsersContributionsData(
  supabase: DbClient
): Promise<Record<string, ContributionData[]>> {
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const ninetyDaysAgo = new Date(todayEnd);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  
  const { data, error } = await supabase
    .from('idea_comments')
    .select('user_id, created_at')
    .gte('created_at', ninetyDaysAgo.toISOString())
    .lte('created_at', todayEnd.toISOString());
    
  if (error) {
    console.error('Error fetching all users contributions:', error);
    return {};
  }
  
  // Group contributions by user_id
  const contributionsByUser: Record<string, {[date: string]: number}> = {};
  
  data.forEach(comment => {
    const { user_id, created_at } = comment;
    // Skip null user_ids
    if (!user_id) return;
    
    const date = new Date(created_at).toISOString().split('T')[0];
    
    if (!contributionsByUser[user_id]) {
      contributionsByUser[user_id] = {};
    }
    
    contributionsByUser[user_id][date] = (contributionsByUser[user_id][date] || 0) + 1;
  });
  
  // Convert to the expected format
  const result: Record<string, ContributionData[]> = {};
  
  Object.entries(contributionsByUser).forEach(([userId, counts]) => {
    result[userId] = Object.entries(counts).map(([date, count]) => ({
      date,
      count,
    }));
  });
  
  return result;
}

// These are the exported functions that will be used by components

// Get user contributions with proper caching
export async function getUserContributions(userId: string): Promise<ContributionData[]> {
  const supabase = await createClient(); // Create Supabase client OUTSIDE cache
  
  return cache(
    async (id: string) => {
      // In this cache function, we DON'T create a Supabase client
      // Instead we use the pre-created one which was passed in from outside
      const cachedData = await getUserContributionsData(supabase, id);
      return cachedData;
    },
    [`user-contributions-${userId}`],
    { revalidate: 300 }
  )(userId);
}

// Get idea contributions with proper caching
export async function getIdeaContributions(ideaId: string): Promise<ContributionData[]> {
  const supabase = await createClient(); // Create Supabase client OUTSIDE cache
  
  return cache(
    async (id: string) => {
      const cachedData = await getIdeaContributionsData(supabase, id);
      return cachedData;
    },
    [`idea-contributions-${ideaId}`],
    { revalidate: 300 }
  )(ideaId);
}

// Get all ideas contributions with proper caching
export async function getAllIdeasContributions(): Promise<Record<string, ContributionData[]>> {
  const supabase = await createClient(); // Create Supabase client OUTSIDE cache
  
  return cache(
    async () => {
      const cachedData = await getAllIdeasContributionsData(supabase);
      return cachedData;
    },
    ['all-ideas-contributions'],
    { revalidate: 300 }
  )();
}

// Get all users contributions with proper caching
export async function getAllUsersContributions(): Promise<Record<string, ContributionData[]>> {
  const supabase = await createClient(); // Create Supabase client OUTSIDE cache
  
  return cache(
    async () => {
      const cachedData = await getAllUsersContributionsData(supabase);
      return cachedData;
    },
    ['all-users-contributions'],
    { revalidate: 300 }
  )();
}
