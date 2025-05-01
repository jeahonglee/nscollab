'use client';

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserBalance, DemodayEntry } from '@/types/demoday';
import { AlertCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface AngelRegistrationProps {
  demoday: DemodayEntry;
  user: User | null;
  userBalance: UserBalance | null;
  onRegistrationComplete: (balance: UserBalance) => void;
}

export default function AngelRegistration({
  demoday,
  user,
  userBalance,
  onRegistrationComplete,
}: AngelRegistrationProps) {
  const supabase = createClient();
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debug logging
  console.log('AngelRegistration component:', {
    demoday_id: demoday?.id,
    user_id: user?.id,
    userBalance,
    isAngel: userBalance?.is_angel,
  });

  // Check if user is already registered as an angel investor
  const isAngel = userBalance?.is_angel || false;

  const handleRegisterAsAngel = async () => {
    if (!user) return;

    setIsRegistering(true);
    setError(null);

    try {
      console.log('Attempting to register as angel for demoday:', demoday.id);

      // Create optimistic balance object for immediate UI feedback
      const optimisticBalance = {
        id: `temp-${Date.now()}`,
        demoday_id: demoday.id,
        user_id: user.id,
        initial_balance: 1000000,
        remaining_balance: 1000000,
        final_balance: null,
        is_angel: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Optimistically update the UI immediately
      onRegistrationComplete(optimisticBalance as UserBalance);

      // Try using the RPC function with the correct parameter names
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'register_as_angel',
        {
          p_demoday_id: demoday.id,
          p_user_id: user.id,
        }
      );

      if (rpcError) {
        console.log('RPC error:', rpcError);
        console.log('Falling back to direct table operations...');

        // First, try a direct insertion into the user_balances table
        const { data: balanceData, error: insertError } = await supabase
          .from('user_balances')
          .insert({
            demoday_id: demoday.id,
            user_id: user.id,
            initial_balance: 1000000,
            remaining_balance: 1000000,
            is_angel: true,
          })
          .select('*')
          .single();

        if (insertError) {
          console.log('Insert error:', insertError);
          console.log('Falling back to update...');

          // If insertion fails, fallback to updating existing record
          const { data: updateData, error: updateError } = await supabase
            .from('user_balances')
            .update({
              is_angel: true,
              initial_balance: 1000000,
              remaining_balance: 1000000,
            })
            .eq('demoday_id', demoday.id)
            .eq('user_id', user.id)
            .select('*')
            .single();

          if (updateError) {
            console.log('Update error:', updateError);
            console.log('Using client-side optimistic balance');
            // The optimistic update we sent earlier will be used
            return;
          }

          console.log('Successfully updated balance:', updateData);
          onRegistrationComplete(updateData);
        } else {
          console.log('Successfully inserted balance:', balanceData);
          onRegistrationComplete(balanceData);
        }
      } else {
        console.log('RPC registration successful:', rpcData);

        // Fetch the created/updated balance record
        const { data: balanceData, error: fetchError } = await supabase
          .from('user_balances')
          .select('*')
          .eq('demoday_id', demoday.id)
          .eq('user_id', user.id)
          .single();

        if (fetchError) {
          console.log('Error fetching balance after RPC:', fetchError);
          // No need to throw error - we already displayed the optimistic UI
          return;
        }

        console.log('Successfully fetched balance after RPC:', balanceData);
        onRegistrationComplete(balanceData);
      }
    } catch (err) {
      console.error('Error registering as angel investor:', err);
      setError(
        `Failed to register: ${err instanceof Error ? err.message : JSON.stringify(err)}`
      );
    } finally {
      setIsRegistering(false);
    }
  };

  if (isAngel) {
    return null; // Don't show anything if already registered
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Become an Angel Investor</CardTitle>
        <CardDescription>
          Register to participate in funding projects
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Register as an Angel Investor to receive $1,000,000 in virtual
            currency to invest in today&apos;s pitches. The top funded ideas
            will earn returns for their investors!
          </p>

          <Button
            onClick={handleRegisterAsAngel}
            disabled={isRegistering}
            className="w-full"
          >
            {isRegistering ? 'Registering...' : 'Register as Angel Investor'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
