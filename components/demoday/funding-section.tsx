'use client';

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DemodayEntry, UserBalance } from '@/types/demoday';
import AngelRegistration from './angel-registration';
import { createClient } from '@/utils/supabase/client';
import { InfoIcon } from 'lucide-react';
import Image from 'next/image';

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

// Type for investment data
type Investment = {
  id: string;
  pitch_id: string;
  amount: number;
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

// Create a memoized debug component to prevent re-renders
const DebugInfo = memo(({ investments }: { investments: Investment[] }) => (
  <Card className="mb-6 bg-gray-900 border-yellow-800">
    <CardContent className="pt-4 text-xs">
      <details>
        <summary className="cursor-pointer text-yellow-400 mb-2">
          Debug Information (click to expand)
        </summary>
        <div className="space-y-2 text-gray-400">
          <p>Current Investments: {investments.length}</p>
          <ul className="list-disc pl-5 space-y-1">
            {investments.map((inv) => (
              <li key={inv.id}>
                Pitch ID: {inv.pitch_id} - Amount: $
                {typeof inv.amount === 'number'
                  ? inv.amount.toLocaleString()
                  : inv.amount}
              </li>
            ))}
          </ul>
        </div>
      </details>
    </CardContent>
  </Card>
));
DebugInfo.displayName = 'DebugInfo';

// Memoized PitchCard component to prevent unnecessary re-renders
interface PitchCardProps {
  pitch: Pitch;
  currentInvestmentAmount: number;
  remainingBalance: number;
  investmentAmount: string;
  isInvesting: boolean;
  onAmountChange: (value: string) => void;
  onAddAmount: (amount: number) => void;
  onInvestAll: () => void;
  onInvest: () => void;
}

const PitchCard = memo(
  ({
    pitch,
    currentInvestmentAmount,
    remainingBalance,
    investmentAmount,
    isInvesting,
    onAmountChange,
    onAddAmount,
    onInvestAll,
    onInvest,
  }: PitchCardProps) => {
    const hasInvested = currentInvestmentAmount > 0;

    return (
      <Card key={pitch.id} className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left side: Pitch information */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                {pitch.profiles.avatar_url ? (
                  <div className="relative h-12 w-12 rounded-full overflow-hidden">
                    <Image
                      src={pitch.profiles.avatar_url}
                      alt={pitch.profiles.full_name || 'Pitcher'}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gray-700 flex items-center justify-center text-lg font-semibold">
                    {(pitch.profiles.full_name || 'A').charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold">{pitch.ideas.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    by{' '}
                    {pitch.profiles.full_name ||
                      pitch.profiles.discord_username ||
                      'Anonymous'}
                  </p>
                </div>
              </div>

              {/* Always show the investment amount section */}
              <div className="mb-4 flex items-center p-3 bg-blue-950/40 rounded-md border border-blue-800">
                <div className="flex-1">
                  <p className="text-blue-300 font-medium">Your Investment</p>
                  <p className="text-xl font-bold text-blue-100">
                    ${currentInvestmentAmount.toLocaleString()}
                  </p>
                </div>
                {hasInvested && (
                  <div className="rounded-full bg-blue-600 px-3 py-1 text-xs font-medium">
                    Invested
                  </div>
                )}
              </div>

              <div className="my-4">
                <p className="text-sm text-gray-300">
                  {pitch.ideas.description}
                </p>
              </div>
            </div>

            {/* Right side: Investment controls */}
            <div className="flex flex-col gap-3 min-w-[320px]">
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={investmentAmount || '0'}
                  onChange={(e) => onAmountChange(e.target.value)}
                  className="text-right"
                  placeholder="Amount to invest"
                />
                <span className="whitespace-nowrap text-gray-400">
                  / ${remainingBalance.toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAddAmount(1000)}
                  disabled={!remainingBalance}
                >
                  +$1k
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAddAmount(10000)}
                  disabled={!remainingBalance}
                >
                  +$10k
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAddAmount(100000)}
                  disabled={!remainingBalance}
                >
                  +$100k
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onInvestAll}
                  disabled={!remainingBalance}
                >
                  All
                </Button>
              </div>

              <Button
                className="w-full"
                onClick={onInvest}
                disabled={
                  isInvesting ||
                  !investmentAmount ||
                  parseInt(investmentAmount, 10) <= 0 ||
                  parseInt(investmentAmount, 10) > remainingBalance
                }
              >
                {isInvesting
                  ? 'Investing...'
                  : hasInvested
                    ? 'Add Investment'
                    : 'Invest'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);
PitchCard.displayName = 'PitchCard';

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
  // Debug logging - reduce to minimal
  // console.log('FundingSection props:', {
  //  demoday_id: demoday?.id,
  //  pitches_count: pitches?.length,
  //  userBalance,
  //  isHost,
  //  user_id: user?.id,
  // });

  const supabase = createClient();
  const [investmentAmounts, setInvestmentAmounts] = useState<
    Record<string, string>
  >({});
  const [isInvesting, setIsInvesting] = useState<Record<string, boolean>>({});
  const [currentInvestments, setCurrentInvestments] = useState<Investment[]>(
    []
  );
  const [isLoadingInvestments, setIsLoadingInvestments] = useState(true);
  // Add local state for user balance to avoid parent component refreshes
  const [localUserBalance, setLocalUserBalance] = useState<UserBalance | null>(
    userBalance
  );

  // Update local balance when prop changes (on initial load)
  useEffect(() => {
    if (userBalance) {
      setLocalUserBalance(userBalance);
    }
  }, [userBalance]); // Include userBalance in the dependency array

  // Fetch current investments with improved error handling - only run once on initial load
  useEffect(() => {
    async function fetchInvestments() {
      if (!demoday || !user) return;

      setIsLoadingInvestments(true);
      try {
        // Direct SQL query without excessive logging
        const { data, error } = await supabase.rpc('debug_get_investments', {
          p_demoday_id: demoday.id,
          p_investor_id: user.id,
        });

        if (error) {
          console.error('RPC error for investments:', error);

          // Fall back to direct query
          const { data: directData, error: directError } = await supabase
            .from('demoday_investments')
            .select('*')
            .eq('demoday_id', demoday.id)
            .eq('investor_id', user.id);

          if (directError) {
            console.error('Direct query error:', directError);
          } else {
            setCurrentInvestments(directData || []);
          }
        } else {
          setCurrentInvestments(data || []);
        }
      } catch (err) {
        console.error('Error fetching investments:', err);
      } finally {
        setIsLoadingInvestments(false);
      }
    }

    fetchInvestments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoday?.id, user?.id]); // Only run on initial load and when demoday or user changes

  // Memoize investment lookup map for faster access
  const investmentMap = useMemo(() => {
    const map = new Map<string, number>();
    currentInvestments.forEach((inv) => {
      let amount = 0;
      if (typeof inv.amount === 'number') {
        amount = inv.amount;
      } else if (typeof inv.amount === 'string') {
        amount = parseFloat(inv.amount) || 0;
      } else {
        amount = parseFloat(String(inv.amount)) || 0;
      }
      map.set(inv.pitch_id, amount);
    });
    return map;
  }, [currentInvestments]);

  // Get current investment for a pitch - memoized to avoid recalculation on every render
  const getCurrentInvestment = useCallback(
    (pitchId: string): number => {
      return investmentMap.get(pitchId) || 0;
    },
    [investmentMap]
  );

  // Handle investment amount change
  const handleAmountChange = useCallback((pitchId: string, value: string) => {
    // Remove non-numeric characters and leading zeros
    const cleanValue = value.replace(/[^0-9]/g, '').replace(/^0+/, '') || '0';

    // Immediately update the input value for a more responsive UI
    setInvestmentAmounts((prev) => ({
      ...prev,
      [pitchId]: cleanValue,
    }));
  }, []);

  // Add specific amount to current investment
  const addAmount = useCallback(
    (pitchId: string, amount: number) => {
      const currentAmount = parseInt(investmentAmounts[pitchId] || '0', 10);
      const newAmount = currentAmount + amount;

      // Make sure we don't exceed the remaining balance
      const maxAmount = localUserBalance?.remaining_balance || 0;
      const finalAmount = Math.min(newAmount, maxAmount);

      setInvestmentAmounts((prev) => ({
        ...prev,
        [pitchId]: finalAmount.toString(),
      }));
    },
    [investmentAmounts, localUserBalance?.remaining_balance]
  );

  // Invest all remaining balance
  const investAll = useCallback(
    (pitchId: string) => {
      setInvestmentAmounts((prev) => ({
        ...prev,
        [pitchId]: (localUserBalance?.remaining_balance || 0).toString(),
      }));
    },
    [localUserBalance?.remaining_balance]
  );

  // Handle investing in a pitch
  const handleInvest = useCallback(
    async (pitchId: string) => {
      if (!demoday || !localUserBalance || !user) return;

      const amount = parseInt(investmentAmounts[pitchId] || '0', 10);
      if (amount <= 0 || amount > (localUserBalance.remaining_balance || 0))
        return;

      setIsInvesting((prev) => ({ ...prev, [pitchId]: true }));

      try {
        // Calculate new remaining balance
        const newRemainingBalance = localUserBalance.remaining_balance - amount;

        // Find existing investment if any
        const existingInvestment = currentInvestments.find(
          (inv) => inv.pitch_id === pitchId
        );

        // Optimistically update the UI
        // 1. Update the local user balance
        const updatedBalance = {
          ...localUserBalance,
          remaining_balance: newRemainingBalance,
        };
        setLocalUserBalance(updatedBalance);

        // 2. Update the investments list
        let updatedInvestments = [...currentInvestments];
        if (existingInvestment) {
          // Update existing investment
          updatedInvestments = updatedInvestments.map((inv) =>
            inv.pitch_id === pitchId
              ? { ...inv, amount: existingInvestment.amount + amount }
              : inv
          );
        } else {
          // Add new investment (with temporary ID)
          updatedInvestments.push({
            id: `temp-${Date.now()}`,
            pitch_id: pitchId,
            amount: amount,
          });
        }
        setCurrentInvestments(updatedInvestments);

        // Reset the input field
        setInvestmentAmounts((prev) => ({ ...prev, [pitchId]: '0' }));

        // Now perform the actual server update in the background
        const { error: rpcError } = await supabase.rpc('upsert_investment', {
          p_demoday_id: demoday.id,
          p_investor_id: user.id,
          p_pitch_id: pitchId,
          p_amount: existingInvestment
            ? existingInvestment.amount + amount // Add to existing amount
            : amount, // New investment
        });

        // If RPC fails, revert the optimistic updates
        if (rpcError) {
          console.error('RPC error:', rpcError);

          // Revert local state updates
          setLocalUserBalance(localUserBalance);
          setCurrentInvestments(currentInvestments);

          throw rpcError;
        }

        // Update the server-side user balance
        const { error: balanceError } = await supabase
          .from('user_balances')
          .update({ remaining_balance: newRemainingBalance })
          .eq('id', localUserBalance.id);

        if (balanceError) {
          console.error('Balance update error:', balanceError);

          // If balance update fails but investment succeeded,
          // fetch the correct balance instead of reverting
          const { data: refreshedBalance, error: refreshError } = await supabase
            .from('user_balances')
            .select('*')
            .eq('id', localUserBalance.id)
            .single();

          if (!refreshError && refreshedBalance) {
            setLocalUserBalance(refreshedBalance);
            // Update parent without triggering re-renders
            if (
              JSON.stringify(refreshedBalance) !== JSON.stringify(userBalance)
            ) {
              onRefreshBalance(refreshedBalance);
            }
          } else {
            // Revert on complete failure
            setLocalUserBalance(localUserBalance);
          }
        } else {
          // Only update parent component if necessary to avoid re-renders
          if (JSON.stringify(updatedBalance) !== JSON.stringify(userBalance)) {
            onRefreshBalance(updatedBalance);
          }
        }
      } catch (err) {
        console.error('Error investing:', err);
      } finally {
        setIsInvesting((prev) => ({ ...prev, [pitchId]: false }));
      }
    },
    [
      demoday,
      localUserBalance,
      user,
      currentInvestments,
      investmentAmounts,
      userBalance,
      onRefreshBalance,
      supabase,
    ]
  );

  // If user is not an angel investor, show registration form
  if (!localUserBalance?.is_angel) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Funding</CardTitle>
        </CardHeader>
        <CardContent>
          <AngelRegistration
            demoday={demoday}
            user={user}
            userBalance={localUserBalance}
            onRegistrationComplete={onRefreshBalance}
          />

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
        </CardContent>
      </Card>
    );
  }

  // User is an angel investor, show funding interface
  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <InfoIcon size={20} className="text-blue-500" />
            <CardTitle>Welcome to the Demoday Funding! 🚀</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            You have ${localUserBalance.initial_balance.toLocaleString()} to
            invest in the pitched ideas as they present. The top 5 funded ideas
            will earn returns of 20x, 10x, 5x, 3x, and 2x respectively for their
            investors.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Your Investment Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Remaining</span>
              <span className="font-semibold">
                ${localUserBalance.remaining_balance.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Invested</span>
              <span className="font-semibold">
                $
                {(
                  localUserBalance.initial_balance -
                  localUserBalance.remaining_balance
                ).toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-gray-800 h-2 rounded-full mt-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{
                  width: `${Math.max(0, (100 * (localUserBalance.initial_balance - localUserBalance.remaining_balance)) / localUserBalance.initial_balance)}%`,
                }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Use memoized debug component */}
      <DebugInfo investments={currentInvestments} />

      {isLoadingInvestments ? (
        <Card className="mb-4">
          <CardContent className="py-6">
            <p className="text-center text-muted-foreground">
              Loading your investments...
            </p>
          </CardContent>
        </Card>
      ) : pitches.length > 0 ? (
        pitches.map((pitch) => {
          const currentInvestmentAmount = getCurrentInvestment(pitch.id);

          return (
            <PitchCard
              key={pitch.id}
              pitch={pitch}
              currentInvestmentAmount={currentInvestmentAmount}
              remainingBalance={localUserBalance.remaining_balance}
              investmentAmount={investmentAmounts[pitch.id] || '0'}
              isInvesting={!!isInvesting[pitch.id]}
              onAmountChange={(value) => handleAmountChange(pitch.id, value)}
              onAddAmount={(amount) => addAmount(pitch.id, amount)}
              onInvestAll={() => investAll(pitch.id)}
              onInvest={() => handleInvest(pitch.id)}
            />
          );
        })
      ) : (
        <Card>
          <CardContent className="py-6">
            <p className="text-center text-muted-foreground">
              No pitches available for funding.
            </p>
          </CardContent>
        </Card>
      )}

      {isHost && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <Button
              onClick={onCalculateResults}
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing
                ? 'Processing...'
                : 'Calculate Results & End Demoday'}
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  );
}
