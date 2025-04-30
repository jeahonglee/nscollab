'use client';

import React from 'react';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DemodayEntry, UserBalance } from '@/types/demoday';

// Define the Pitch type here instead of importing it
type Pitch = {
  id: string;
  idea_id: string;
  pitcher_id: string;
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

interface FundingSectionProps {
  demoday: DemodayEntry;
  pitches: Pitch[];
  userBalance: UserBalance | null;
  isHost: boolean;
  user: User;
  onCalculateResults: () => Promise<void>;
  onRefreshBalance: (balance: UserBalance) => void;
  isProcessing: boolean;
}

export default function FundingSection({
  isHost,
  onCalculateResults,
  isProcessing,
}: FundingSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Demoday Funding</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isHost && (
            <div className="mt-4">
              <Button
                onClick={onCalculateResults}
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing
                  ? 'Processing...'
                  : 'Calculate Results & End Demoday'}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
