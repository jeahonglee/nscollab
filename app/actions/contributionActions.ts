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

  const { data, error } = await supabase
    .from('idea_comments')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()); // Filter for last year

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

    const { data, error } = await supabase
      .from('idea_comments')
      .select('created_at')
      .eq('idea_id', ideaId)
      .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()); // Filter for last year

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
