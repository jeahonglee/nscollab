// Database types for the NS Connect Platform
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          full_name: string | null
          avatar_url: string | null
          discord_username: string | null
          x_handle: string | null
          linkedin_url: string | null
          github_username: string | null
          instagram_handle: string | null
          threads_handle: string | null
          youtube_url: string | null
          email: string | null
          bio: string | null
          skills: string[] | null
          status_tags: string[] | null
          custom_links: Json | null
          nspals_profile_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          full_name?: string | null
          avatar_url?: string | null
          discord_username?: string | null
          x_handle?: string | null
          linkedin_url?: string | null
          github_username?: string | null
          instagram_handle?: string | null
          threads_handle?: string | null
          youtube_url?: string | null
          email?: string | null
          bio?: string | null
          skills?: string[] | null
          status_tags?: string[] | null
          custom_links?: Json | null
          nspals_profile_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          full_name?: string | null
          avatar_url?: string | null
          discord_username?: string | null
          x_handle?: string | null
          linkedin_url?: string | null
          github_username?: string | null
          instagram_handle?: string | null
          threads_handle?: string | null
          youtube_url?: string | null
          email?: string | null
          bio?: string | null
          skills?: string[] | null
          status_tags?: string[] | null
          custom_links?: Json | null
          nspals_profile_url?: string | null
        }
      }
      ns_stays: {
        Row: {
          id: string
          profile_id: string
          active_months?: string[] | null
          start_month?: string | null
          created_at: string
          updated_at?: string | null
        }
        Insert: {
          id?: string
          profile_id: string
          active_months?: string[] | null
          start_month?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          profile_id?: string
          active_months?: string[] | null
          start_month?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      ideas: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          last_activity_at: string
          submitter_user_id: string
          title: string
          description: string
          status: string
          looking_for_tags: string[] | null
          is_archived: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          last_activity_at?: string
          submitter_user_id: string
          title: string
          description: string
          status?: string
          looking_for_tags?: string[] | null
          is_archived?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          last_activity_at?: string
          submitter_user_id?: string
          title?: string
          description?: string
          status?: string
          looking_for_tags?: string[] | null
          is_archived?: boolean
        }
      }
      idea_members: {
        Row: {
          id: string
          idea_id: string
          user_id: string
          role: string
          joined_at: string
        }
        Insert: {
          id?: string
          idea_id: string
          user_id: string
          role?: string
          joined_at?: string
        }
        Update: {
          id?: string
          idea_id?: string
          user_id?: string
          role?: string
          joined_at?: string
        }
      }
      idea_comments: {
        Row: {
          id: string
          idea_id: string
          user_id: string | null
          comment_text: string
          created_at: string
        }
        Insert: {
          id?: string
          idea_id: string
          user_id?: string | null
          comment_text: string
          created_at?: string
        }
        Update: {
          id?: string
          idea_id?: string
          user_id?: string | null
          comment_text?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Custom types for the application

export type CustomLink = {
  label: string
  url: string
}

// Profile with related data
export type ProfileWithRelations = Database['public']['Tables']['profiles']['Row'] & {
  ns_stays?: Database['public']['Tables']['ns_stays']['Row'][]
}

// Idea with related data (members, comments)
export type IdeaWithRelations = Database['public']['Tables']['ideas']['Row'] & {
  profile?: Database['public']['Tables']['profiles']['Row'];
  members?: (Database['public']['Tables']['idea_members']['Row'] & {
    profile?: Database['public']['Tables']['profiles']['Row']
  })[];
  comments?: (Database['public']['Tables']['idea_comments']['Row'] & {
    profile?: Database['public']['Tables']['profiles']['Row']
  })[];
}

// Status tags and looking_for tags as constants
export const STATUS_TAGS = [
  'Has Full-Time Job',
  'Solo Founder (Stealth)',
  'Solo Founder (Launched)',
  'Has Team/Co-founders',
  'Looking to Join Project',
  'Looking for Co-founder(s)',
  'Looking for Teammates',
  'Hiring',
  'Open to Networking',
  'Building for Fun',
  'Building for Hackathon'
] as const

export const IDEA_STATUSES = [
  'Ideation',
  'Planning',
  'Building (MVP)',
  'Launched',
  'Actively Recruiting',
  'Seeking Feedback',
  'Paused / On Hold',
  'Archived'
] as const

export const LOOKING_FOR_TAGS = [
  'Need Frontend Dev',
  'Need Backend Dev',
  'Need Full-Stack Dev',
  'Need Designer',
  'Need Marketer',
  'Need Co-founder',
  'Need Product Manager',
  'Need Technical Lead',
  'Need Financial Support'
] as const
