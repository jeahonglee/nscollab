'use client';

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Info } from 'lucide-react';
import { DemodayEntry, Pitch, UserBalance } from '@/types/demoday';
import { formatCurrency } from '@/lib/utils';
import AngelRegistration from './angel-registration';

interface FundingSectionProps {
  demoday: DemodayEntry;
  pitches: Pitch[];
  userBalance: UserBalance | null;
  isHost: boolean;
  user: User | null;
  onCalculateResults: () => Promise<void>;
  onRefreshBalance: (balance: UserBalance) => void;
  isProcessing: boolean;
}

export default function FundingSection({
  demoday,
  pitches,
  userBalance,
  isHost,
  user,
  onCalculateResults,
  onRefreshBalance,
  isProcessing,
}: FundingSectionProps) {
  const supabase = createClient();
  const [investAmounts, setInvestAmounts] = useState<Record<string, string>>(
    {}
  );
  const [investing, setInvesting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if user is registered as an angel investor
  const isAngel = userBalance?.is_angel || false;

  // Handle investment amount change
  const handleAmountChange = (pitchId: string, value: string) => {
    // Only allow numeric input with up to 2 decimal places
    if (value === '' || /^\d+(\.\d{0,2})?$/.test(value)) {
      setInvestAmounts((prev) => ({
        ...prev,
        [pitchId]: value,
      }));
    }
  };

  // Handle investment submission
  const handleInvest = async (pitchId: string) => {
    if (!user || !userBalance || !isAngel) return;

    const amount = parseFloat(investAmounts[pitchId] || '0');
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount greater than zero.');
      return;
    }

    if (amount > userBalance.remaining_balance) {
      setError(
        `You don't have enough funds. Your remaining balance is ${formatCurrency(userBalance.remaining_balance)}.`
      );
      return;
    }

    setInvesting(pitchId);
    setError(null);

    try {
      // First, update the user's balance
      const newRemainingBalance = userBalance.remaining_balance - amount;
      const { error: balanceError } = await supabase
        .from('user_balances')
        .update({
          remaining_balance: newRemainingBalance,
        })
        .eq('demoday_id', demoday.id)
        .eq('user_id', user.id);

      if (balanceError) throw balanceError;

      // Then, record the investment
      const { error: investError } = await supabase
        .from('demoday_investments')
        .insert({
          demoday_id: demoday.id,
          investor_id: user.id,
          pitch_id: pitchId,
          amount: amount,
        });

      if (investError) throw investError;

      // Update local state
      setInvestAmounts((prev) => ({
        ...prev,
        [pitchId]: '',
      }));

      // Update the user's balance in parent component
      onRefreshBalance({
        ...userBalance,
        remaining_balance: newRemainingBalance,
      });
    } catch (err) {
      console.error('Error making investment:', err);
      setError(
        `Failed to invest: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    } finally {
      setInvesting(null);
    }
  };

  // Format the initials for avatar fallback
  const getInitials = (name: string | null): string => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Render the funding instructions
  const renderInstructions = () => (
    <Alert className="mb-6">
      <Info className="h-4 w-4" />
      <AlertDescription>
        <p className="mb-2">
          <strong>Welcome to the Demoday Funding! 🚀</strong>
        </p>
        <p>
          You have {formatCurrency(userBalance?.remaining_balance || 0)} to
          invest in the pitched ideas as they present. The top 5 funded ideas
          will earn returns of 20x, 10x, 5x, 3x, and 2x respectively for their
          investors.
        </p>
      </AlertDescription>
    </Alert>
  );

  // Render the user's balance
  const renderBalance = () => {
    if (!userBalance) return null;

    const percentUsed =
      ((userBalance.initial_balance - userBalance.remaining_balance) /
        userBalance.initial_balance) *
      100;

    return (
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Your Investment Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-2">
            <div>Remaining</div>
            <div className="font-semibold">
              {formatCurrency(userBalance.remaining_balance)}
            </div>
          </div>
          <div className="flex justify-between mb-4">
            <div>Invested</div>
            <div>
              {formatCurrency(
                userBalance.initial_balance - userBalance.remaining_balance
              )}
            </div>
          </div>
          <Progress value={percentUsed} className="h-2" />
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="border-t pt-6 mt-6">
        <h2 className="text-xl font-bold mb-4">Funding</h2>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Show angel registration for non-registered users */}
        {user && !isAngel && (
          <AngelRegistration
            demoday={demoday}
            user={user}
            userBalance={userBalance}
            onRegistrationComplete={onRefreshBalance}
          />
        )}

        {/* Only show instructions & balance if user is logged in and is an angel */}
        {user && isAngel && (
          <>
            {renderInstructions()}
            {renderBalance()}
          </>
        )}

        {/* Pitch Cards with Investment Controls */}
        <div className="grid grid-cols-1 gap-6">
          {pitches.map((pitch) => (
            <Card key={pitch.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={pitch.profiles.avatar_url || ''}
                      alt={pitch.profiles.full_name || 'User'}
                    />
                    <AvatarFallback>
                      {getInitials(pitch.profiles.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">
                      {pitch.ideas.title}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      by{' '}
                      {pitch.profiles.full_name ||
                        pitch.profiles.discord_username ||
                        'Anonymous'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {pitch.ideas.description}
                </p>
              </CardContent>
              {/* Only show investment controls to angel investors */}
              {user && userBalance && isAngel && (
                <CardFooter className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
                  <div className="flex w-full">
                    <div className="flex-1 mr-2">
                      <Input
                        type="text"
                        placeholder="Amount to invest"
                        value={investAmounts[pitch.id] || ''}
                        onChange={(e) =>
                          handleAmountChange(pitch.id, e.target.value)
                        }
                        disabled={investing === pitch.id}
                      />
                    </div>
                    <Button
                      onClick={() => handleInvest(pitch.id)}
                      disabled={
                        investing === pitch.id ||
                        !investAmounts[pitch.id] ||
                        parseFloat(investAmounts[pitch.id]) <= 0
                      }
                    >
                      {investing === pitch.id ? 'Investing...' : 'Invest'}
                    </Button>
                  </div>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Host Controls */}
      {isHost && (
        <div className="mt-8 flex justify-center">
          <Button
            onClick={onCalculateResults}
            disabled={isProcessing}
            size="lg"
            variant="default"
          >
            {isProcessing
              ? 'Calculating...'
              : 'Calculate Winners & End Demoday'}
          </Button>
        </div>
      )}
    </div>
  );
}
