export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      demodays: {
        Row: {
          id: string;
          event_date: string;
          details: {
            when: string | null;
            where: string | null;
            what: string | null;
            luma_url: string | null;
          };
          status: 'upcoming' | 'pitching' | 'completed';
          is_active: boolean;
          host_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_date: string;
          details?: Json;
          status?: 'upcoming' | 'pitching' | 'completed';
          is_active?: boolean;
          host_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_date?: string;
          details?: Json;
          status?: 'upcoming' | 'pitching' | 'completed';
          is_active?: boolean;
          host_id?: string | null;
          created_at?: string;
        };
      };
      demoday_pitches: {
        Row: {
          id: string;
          demoday_id: string;
          idea_id: string;
          pitcher_id: string;
          submitted_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          demoday_id: string;
          idea_id: string;
          pitcher_id: string;
          submitted_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          demoday_id?: string;
          idea_id?: string;
          pitcher_id?: string;
          submitted_at?: string;
          created_at?: string;
        };
      };
      demoday_investments: {
        Row: {
          id: string;
          demoday_id: string;
          investor_id: string;
          pitch_id: string;
          amount: number;
          adjusted_amount: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          demoday_id: string;
          investor_id: string;
          pitch_id: string;
          amount: number;
          adjusted_amount?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          demoday_id?: string;
          investor_id?: string;
          pitch_id?: string;
          amount?: number;
          adjusted_amount?: number | null;
          created_at?: string;
        };
      };
      demoday_results: {
        Row: {
          id: string;
          demoday_id: string;
          calculated_at: string;
          pitch_rankings: Json;
          investor_rankings: Json;
        };
        Insert: {
          id?: string;
          demoday_id: string;
          calculated_at?: string;
          pitch_rankings?: Json;
          investor_rankings?: Json;
        };
        Update: {
          id?: string;
          demoday_id?: string;
          calculated_at?: string;
          pitch_rankings?: Json;
          investor_rankings?: Json;
        };
      };
      user_balances: {
        Row: {
          id: string;
          demoday_id: string;
          user_id: string;
          initial_balance: number;
          remaining_balance: number;
          final_balance: number | null;
          is_angel: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          demoday_id: string;
          user_id: string;
          initial_balance?: number;
          remaining_balance?: number;
          final_balance?: number | null;
          is_angel?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          demoday_id?: string;
          user_id?: string;
          initial_balance?: number;
          remaining_balance?: number;
          final_balance?: number | null;
          is_angel?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Include other tables as needed
      ideas: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          last_activity_at: string;
          submitter_user_id: string;
          title: string;
          description: string;
          status: string;
          looking_for_tags: string[];
          is_archived: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          last_activity_at?: string;
          submitter_user_id: string;
          title: string;
          description: string;
          status?: string;
          looking_for_tags?: string[];
          is_archived?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          last_activity_at?: string;
          submitter_user_id?: string;
          title?: string;
          description?: string;
          status?: string;
          looking_for_tags?: string[];
          is_archived?: boolean;
        };
      };
      idea_members: {
        Row: {
          id: string;
          idea_id: string;
          user_id: string;
          role: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          idea_id: string;
          user_id: string;
          role?: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          idea_id?: string;
          user_id?: string;
          role?: string;
          joined_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          full_name: string | null;
          avatar_url: string | null;
          discord_username: string | null;
          x_handle: string | null;
          linkedin_url: string | null;
          github_username: string | null;
          instagram_handle: string | null;
          threads_handle: string | null;
          youtube_url: string | null;
          bio: string | null;
          background: string | null;
          skills: string[] | null;
          status_tags: string[] | null;
          custom_links: Json | null;
          nspals_profile_url: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          discord_username?: string | null;
          x_handle?: string | null;
          linkedin_url?: string | null;
          github_username?: string | null;
          instagram_handle?: string | null;
          threads_handle?: string | null;
          youtube_url?: string | null;
          bio?: string | null;
          background?: string | null;
          skills?: string[] | null;
          status_tags?: string[] | null;
          custom_links?: Json | null;
          nspals_profile_url?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          discord_username?: string | null;
          x_handle?: string | null;
          linkedin_url?: string | null;
          github_username?: string | null;
          instagram_handle?: string | null;
          threads_handle?: string | null;
          youtube_url?: string | null;
          bio?: string | null;
          background?: string | null;
          skills?: string[] | null;
          status_tags?: string[] | null;
          custom_links?: Json | null;
          nspals_profile_url?: string | null;
        };
      };
    };
    Functions: {
      start_demoday_pitching: {
        Args: {
          demoday_id: string;
        };
        Returns: boolean;
      };
      register_as_angel: {
        Args: {
          demoday_id: string;
          user_id: string;
        };
        Returns: boolean;
      };
      calculate_demoday_results: {
        Args: {
          p_demoday_id: string;
        };
        Returns: boolean;
      };
      force_calculate_demoday_results: {
        Args: {
          p_demoday_id: string;
        };
        Returns: boolean;
      };
    };
  };
}
