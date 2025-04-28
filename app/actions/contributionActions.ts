'use server';

import { createClient } from '@/utils/supabase/server'; // Adjust path as needed
import { unstable_noStore as noStore } from 'next/cache';

interface ContributionData {
  date: string; // YYYY-MM-DD
  count: number;
}

// Fetch contribution data for a specific user
export async function getUserContributions(userId: string): Promise<ContributionData[]> {
  noStore(); // Ensure data is fetched fresh on each request
  const supabase = await createClient();
  
  // Get current date at the end of the day to include all of today's activity
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const oneYearAgo = new Date(todayEnd);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const { data, error } = await supabase
    .from('idea_comments')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', oneYearAgo.toISOString())
    .lte('created_at', todayEnd.toISOString()) // Explicitly include up to now

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

  // Convert to the expected format
  const contributionData: ContributionData[] = Object.entries(counts).map(([date, count]) => ({
    date,
    count,
  }));

  return contributionData;
}


// Fetch contribution data for a specific idea
export async function getIdeaContributions(ideaId: string): Promise<ContributionData[]> {
    noStore(); // Ensure data is fetched fresh on each request
    const supabase = await createClient();
    
    // Get current date at the end of the day to include all of today's activity
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const oneYearAgo = new Date(todayEnd);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const { data, error } = await supabase
      .from('idea_comments')
      .select('created_at')
      .eq('idea_id', ideaId)
      .gte('created_at', oneYearAgo.toISOString())
      .lte('created_at', todayEnd.toISOString()) // Explicitly include up to now

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

    // Convert to the expected format
    const contributionData: ContributionData[] = Object.entries(counts).map(([date, count]) => ({
      date,
      count,
    }));

    return contributionData;
}

// Get contribution data for all ideas (for the ideas list view)
export async function getAllIdeasContributions(): Promise<Record<string, ContributionData[]>> {
    noStore();
    const supabase = await createClient();
    
    // Get comments from the last 90 days for all ideas
    // Use end of today to ensure we get all recent activities
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

// Get contribution data for all users (for the people list view)
export async function getAllUsersContributions(): Promise<Record<string, ContributionData[]>> {
    noStore();
    const supabase = await createClient();
    
    // Get comments from the last 90 days for all users
    // Use end of today to ensure we get all recent activities
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
