import { Database } from './supabase';
import { User } from '@supabase/supabase-js';

export type DemodayDetails = {
  when: string | null;
  where: string | null;
  what: string | null;
  luma_url: string | null;
};

export type DemodayStatus = 'upcoming' | 'pitching' | 'completed';

export type DemodayEntry = {
  id: string;
  event_date: string;
  details: DemodayDetails;
  status: DemodayStatus;
  is_active: boolean;
  host_id: string | null;
  created_at: string;
};

export type Pitch = {
  id: string;
  idea_id: string;
  pitcher_id: string;
  demoday_id: string;
  submitted_at: string;
  ideas: {
    id: string;
    title: string;
    description: string;
  };
  profiles: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    discord_username: string | null;
  };
};

export type Idea = {
  id: string;
  title: string;
  description?: string;
};

export type Investment = {
  id: string;
  demoday_id: string;
  investor_id: string;
  pitch_id: string;
  amount: number;
  created_at: string;
};

export type UserBalance = {
  id: string;
  demoday_id: string;
  user_id: string;
  initial_balance: number;
  remaining_balance: number;
  final_balance: number | null;
  is_angel: boolean;
};

export type PitchRanking = {
  rank: number;
  pitch_id: string;
  idea_id: string;
  idea_title: string;
  pitcher_id: string;
  pitcher_name: string | null;
  pitcher_avatar: string | null;
  pitcher_username: string | null;
  total_funding: number;
};

export type InvestorRanking = {
  rank: number;
  investor_id: string;
  investor_name: string | null;
  investor_avatar: string | null;
  investor_username: string | null;
  initial_balance: number;
  invested_amount: number;
  returns: number;
  final_balance: number;
};

export type DemodayResults = {
  id: string;
  demoday_id: string;
  calculated_at: string;
  pitch_rankings: PitchRanking[];
  investor_rankings: InvestorRanking[];
};

export interface DemodayContentProps {
  serverUser: User | null;
}
