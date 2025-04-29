import {
  createCachedQuery,
  createParameterizedCachedQuery,
  CACHE_TIMES,
} from './index';
import { IdeaWithRelations, ProfileWithRelations } from '@/lib/supabase/types';

// Define types for feedback-related data
interface FeedbackWithProfile {
  id: string;
  message: string;
  user_id: string;
  created_at: string;
  profile: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

/**
 * Cached query to fetch ideas with optional status filtering
 */
export const getIdeasWithCache = createParameterizedCachedQuery<
  string,
  IdeaWithRelations[]
>(
  async (statusFilter, supabase) => {
    // Build query
    let query = supabase
      .from('ideas')
      .select(
        `
        *,
        profile: profiles!ideas_submitter_user_id_fkey (
          id, full_name, avatar_url
        ),
        members: idea_members (
          id, user_id, role,
          profile: profiles (
            id, full_name, avatar_url
          )
        )
      `
      )
      .eq('is_archived', false);

    // Apply status filter if present
    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    // Always sort by most recent activity
    query = query.order('last_activity_at', { ascending: false });

    // Execute query
    const { data, error } = await query;

    if (error) {
      console.error('Error fetching ideas:', error);
      return [];
    }

    return data as IdeaWithRelations[];
  },
  'ideas-list',
  CACHE_TIMES.SHORT
);

/**
 * Cached query to fetch a single idea by ID
 */
export const getIdeaByIdWithCache = createParameterizedCachedQuery<
  string,
  IdeaWithRelations | null
>(
  async (ideaId, supabase) => {
    const { data, error } = await supabase
      .from('ideas')
      .select(
        `
        *,
        profile: profiles!ideas_submitter_user_id_fkey (
          id, full_name, avatar_url, discord_username
        ),
        members: idea_members (
          id, user_id, role,
          profile: profiles (
            id, full_name, avatar_url, discord_username
          )
        )
      `
      )
      .eq('id', ideaId)
      .single();

    if (error) {
      console.error(`Error fetching idea ${ideaId}:`, error);
      return null;
    }

    return data as IdeaWithRelations;
  },
  'idea-by-id',
  CACHE_TIMES.SHORT
);

/**
 * Cached query to fetch profiles with optional tag filtering
 */
export const getProfilesWithCache = createParameterizedCachedQuery<
  string,
  ProfileWithRelations[]
>(
  async (tag, supabase) => {
    // Build the query with nested relation data
    let query = supabase.from('profiles').select(`
      *,
      ns_stays (*)
    `);

    // Only apply tag filter at DB level
    if (tag) {
      query = query.contains('status_tags', [tag]);
    }

    // Execute query to get profiles
    const { data, error } = await query;

    // Handle any errors
    if (error) {
      console.error('Error fetching profiles:', error);
      return [];
    }

    return data as ProfileWithRelations[];
  },
  'profiles-list',
  CACHE_TIMES.SHORT
);

/**
 * Cached query to fetch recent activities for the timeline
 */
export const getRecentCommentsWithCache = createParameterizedCachedQuery<
  string,
  Record<string, unknown>[]
>(
  async (startDateString, supabase) => {
    const { data, error } = await supabase
      .from('idea_comments')
      .select(
        `
        id,
        idea_id,
        user_id,
        comment_text,
        created_at,
        profile: profiles (
          id, full_name, avatar_url, discord_username
        ),
        idea: ideas (
          id, title, status, description, created_at, submitter_user_id,
          profile: profiles!ideas_submitter_user_id_fkey (
            id, full_name, avatar_url, discord_username
          )
        )
      `
      )
      .gte('created_at', startDateString)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching recent comments:', error);
      return [];
    }

    return data || [];
  },
  'recent-comments',
  CACHE_TIMES.SHORT
);

/**
 * Cached query to fetch feedbacks for the feedback board
 * This function returns the actual data, not a Promise to a function
 */
export const getFeedbacksWithCache = async (): Promise<
  FeedbackWithProfile[]
> => {
  return createCachedQuery<FeedbackWithProfile[]>(
    async (supabase) => {
      const { data, error } = await supabase
        .from('feedbacks')
        .select(
          `
          id,
          message,
          user_id,
          created_at,
          profile: profiles (id, full_name, avatar_url)
        `
        )
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching feedbacks:', error);
        return [];
      }

      // Process the feedbacks to handle nested profile data correctly
      return (data || []).map((feedback) => {
        const rawFeedback = feedback as Record<string, unknown>;

        // Extract profile (might be an array or object)
        let profile = null;
        if (rawFeedback.profile) {
          if (
            Array.isArray(rawFeedback.profile) &&
            rawFeedback.profile.length > 0
          ) {
            profile = rawFeedback.profile[0];
          } else {
            profile = rawFeedback.profile;
          }
        }

        return {
          id: rawFeedback.id as string,
          message: rawFeedback.message as string,
          user_id: rawFeedback.user_id as string,
          created_at: rawFeedback.created_at as string,
          profile: profile as {
            id: string;
            full_name: string | null;
            avatar_url: string | null;
          } | null,
        };
      });
    },
    ['feedbacks'],
    CACHE_TIMES.SHORT
  );
};
