'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  format,
  startOfMonth,
  addMonths,
  parseISO,
  isPast,
  isSameMonth,
} from 'date-fns'; // Import date-fns helpers
import PitchItem from './pitch-item';
import PitchModal from './pitch-modal';
import { AlertCircle } from 'lucide-react';
import DemodayDetailsForm from './demoday-details-form';
import FundingSection from './funding-section';
import ResultsSection from './results-section';
import {
  DemodayStatus,
  DemodayResults,
  UserBalance,
  DemodayEntry as ImportedDemodayEntry,
} from '@/types/demoday';
import DemodayDetailsDisplay from './demoday-details-display';

// Interface matching the exact structure from Supabase
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
type Idea = { id: string; title: string };
// Update this to be compatible with the imported type
type DemodayEntry = Omit<ImportedDemodayEntry, 'details'> & {
  details?: Record<string, unknown>;
};

interface DemodayContentProps {
  serverUser: User | null;
}

// Helper function to format date for display
const formatMonthForDisplay = (dateString: string): string => {
  try {
    return format(parseISO(dateString), 'MMM yyyy');
  } catch (e) {
    console.error('Error parsing date for display:', dateString, e);
    return 'Invalid Date';
  }
};

// Helper function to get YYYY-MM-DD from a date
const formatMonthForQuery = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

export default function DemodayContent({ serverUser }: DemodayContentProps) {
  const supabase = createClient();
  const [user] = useState(serverUser);
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [userIdeas, setUserIdeas] = useState<Idea[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(''); // Store YYYY-MM-DD event_date
  const [availableDemodays, setAvailableDemodays] = useState<DemodayEntry[]>(
    []
  ); // Store fetched demodays
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancellingPitchId, setCancellingPitchId] = useState<string | null>(
    null
  );
  const [demodayResults, setDemodayResults] = useState<DemodayResults | null>(
    null
  );
  const [userBalance, setUserBalance] = useState<UserBalance | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Determine current and next month start dates for querying
  const now = useMemo(() => new Date(), []);
  const currentMonthStartDate = useMemo(() => startOfMonth(now), [now]);
  const nextMonthStartDate = useMemo(
    () => startOfMonth(addMonths(now, 1)),
    [now]
  );
  const currentMonthQueryStr = useMemo(
    () => formatMonthForQuery(currentMonthStartDate),
    [currentMonthStartDate]
  );
  const nextMonthQueryStr = useMemo(
    () => formatMonthForQuery(nextMonthStartDate),
    [nextMonthStartDate]
  );

  // Fetch pitches for a specific demoday
  const fetchPitchesForDemoday = useCallback(
    async (demodayId: string) => {
      try {
        const { data: pitchData, error: pitchError } = await supabase
          .from('demoday_pitches')
          .select(
            `
          id,
          demoday_id,
          idea_id,
          pitcher_id,
          submitted_at,
          ideas:ideas ( id, title, description ),
          profiles:profiles ( id, full_name, avatar_url, discord_username )
        `
          )
          .eq('demoday_id', demodayId)
          .order('submitted_at', { ascending: true });

        if (pitchError) throw pitchError;
        setPitches((pitchData as unknown as Pitch[]) || []);
      } catch (err) {
        console.error('Error fetching pitches:', err);
        throw err;
      }
    },
    [supabase]
  );

  // Fetch results for a demoday
  const fetchResultsForDemoday = useCallback(
    async (demodayId: string) => {
      try {
        const { data, error } = await supabase
          .from('demoday_results')
          .select('*')
          .eq('demoday_id', demodayId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No rows returned
            setDemodayResults(null);
            return;
          }
          throw error;
        }

        if (data) {
          // Parse JSON fields if they're returned as strings
          let pitchRankings = data.pitch_rankings;
          let investorRankings = data.investor_rankings;

          // Parse the JSON strings if needed
          if (typeof pitchRankings === 'string') {
            try {
              pitchRankings = JSON.parse(pitchRankings);
            } catch (e) {
              console.error('Error parsing pitch rankings:', e);
              pitchRankings = [];
            }
          }

          if (typeof investorRankings === 'string') {
            try {
              investorRankings = JSON.parse(investorRankings);
            } catch (e) {
              console.error('Error parsing investor rankings:', e);
              investorRankings = [];
            }
          }

          // Create the parsed result object
          const parsedData = {
            ...data,
            pitch_rankings: pitchRankings || [],
            investor_rankings: investorRankings || [],
          };

          console.log('Parsed results data:', parsedData);
          setDemodayResults(parsedData);
        } else {
          setDemodayResults(null);
        }
      } catch (err) {
        console.error('Error fetching results:', err);
        setDemodayResults(null);
      }
    },
    [supabase]
  );

  // Fetch user balance for a demoday
  const fetchUserBalance = useCallback(
    async (demodayId: string, userId: string) => {
      try {
        console.log(
          `Fetching user balance for demoday ${demodayId} and user ${userId}`
        );

        const { data, error } = await supabase
          .from('user_balances')
          .select('*')
          .eq('demoday_id', demodayId)
          .eq('user_id', userId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No rows returned - user hasn't registered as an angel yet
            console.log(
              'No user balance found - user is not an angel investor yet'
            );
            setUserBalance(null);
            return;
          }
          throw error;
        }

        console.log('User balance found:', data);
        setUserBalance(data);
      } catch (err) {
        console.error('Error fetching user balance:', err);
        // For 406 errors, likely a content-type issue - create null balance to allow registration
        setUserBalance(null);
      }
    },
    [supabase]
  );

  // Fetch user's ideas
  const fetchUserIdeas = useCallback(
    async (userId: string) => {
      try {
        const { data: memberData, error: memberError } = await supabase
          .from('idea_members')
          .select('idea_id')
          .eq('user_id', userId);

        if (memberError) throw memberError;
        const ideaIds = memberData?.map((m) => m.idea_id) || [];

        if (ideaIds.length === 0) {
          setUserIdeas([]);
          return;
        }

        const { data: ideaData, error: ideaError } = await supabase
          .from('ideas')
          .select('id, title, description')
          .in('id', ideaIds);

        if (ideaError) throw ideaError;
        setUserIdeas(ideaData || []);
      } catch (err) {
        console.error('Error fetching user ideas:', err);
        setUserIdeas([]);
      }
    },
    [supabase]
  );

  // Fetch all data for a specific demoday
  const fetchDataForDemoday = useCallback(
    async (demodayId: string) => {
      setIsLoading(true);
      try {
        // First, get the demoday status
        const { data: demodayData, error: demodayError } = await supabase
          .from('demodays')
          .select('status, host_id')
          .eq('id', demodayId)
          .single();

        if (demodayError) throw demodayError;

        // Fetch pitches for the demoday (needed for all statuses)
        await fetchPitchesForDemoday(demodayId);

        // Only fetch results and user balances for non-upcoming demodays
        if (demodayData.status !== 'upcoming') {
          // Fetch results if they exist
          await fetchResultsForDemoday(demodayId);

          // Fetch user balance
          if (user) {
            await fetchUserBalance(demodayId, user.id);
          }
        } else {
          // Clear results and balance for upcoming demodays
          setDemodayResults(null);
          setUserBalance(null);
        }

        // Check if user is host
        if (user) {
          const isUserHost =
            user.id === demodayData.host_id || demodayData.host_id === null;
          setIsHost(isUserHost);

          // Update the local availableDemodays with the latest host_id
          setAvailableDemodays((prevDemodays) =>
            prevDemodays.map((d) =>
              d.id === demodayId ? { ...d, host_id: demodayData.host_id } : d
            )
          );
        }
      } catch (err) {
        console.error('Error fetching demoday data:', err);
        setError(
          `Failed to load demoday data: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      } finally {
        setIsLoading(false);
      }
    },
    [
      supabase,
      user,
      fetchPitchesForDemoday,
      fetchResultsForDemoday,
      fetchUserBalance,
    ]
  );

  // Fetch available Demodays and Pitches for the initially selected month
  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch existing/relevant Demoday entries
      const { data: demodayData, error: demodayError } = await supabase
        .from('demodays')
        .select(
          'id, event_date, details, status, is_active, host_id, created_at'
        )
        .in('event_date', [currentMonthQueryStr, nextMonthQueryStr])
        .order('event_date', { ascending: true });

      if (demodayError) throw demodayError;

      const fetchedDemodays = demodayData || [];
      let initialSelectedDemoday: DemodayEntry | null = null;

      // Sort fetched demodays
      fetchedDemodays.sort((a, b) => a.event_date.localeCompare(b.event_date));
      setAvailableDemodays(fetchedDemodays);

      // Determine initial tab selection (prefer future/current)
      const futureOrCurrentDemoday = fetchedDemodays.find(
        (d) =>
          !isPast(parseISO(d.event_date)) ||
          isSameMonth(parseISO(d.event_date), now)
      );
      initialSelectedDemoday =
        futureOrCurrentDemoday ||
        fetchedDemodays[fetchedDemodays.length - 1] ||
        null;

      if (initialSelectedDemoday) {
        setSelectedMonth(initialSelectedDemoday.event_date);
        await fetchDataForDemoday(initialSelectedDemoday.id);
      } else {
        setPitches([]);
      }

      // Check if user is logged in
      if (user) {
        await fetchUserIdeas(user.id);
      }
    } catch (err: unknown) {
      console.error('Error fetching initial demoday data:', err);
      setError(
        `Failed to load initial data: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
      setPitches([]);
      setAvailableDemodays([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    supabase,
    user,
    currentMonthQueryStr,
    nextMonthQueryStr,
    now,
    fetchDataForDemoday,
    fetchUserIdeas,
  ]);

  // Handle month tab change
  const handleMonthChange = (newMonthValue: string) => {
    const selectedDemoday = availableDemodays.find(
      (d) => d.event_date === newMonthValue
    );
    if (selectedDemoday) {
      setSelectedMonth(newMonthValue);
      fetchDataForDemoday(selectedDemoday.id);
    } else {
      console.warn(`No demoday found for event_date: ${newMonthValue}`);
      setPitches([]);
      setDemodayResults(null);
      setUserBalance(null);
    }
  };

  // Initial data fetch on component mount
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Handle pitch submission
  const handlePitchSubmit = async (ideaId: string) => {
    if (!user || !selectedMonth) return;
    const selectedDemoday = availableDemodays.find(
      (d) => d.event_date === selectedMonth
    );
    if (
      !selectedDemoday ||
      !isSelectedMonthEditable ||
      selectedDemoday.is_active
    ) {
      setError(
        'Cannot submit pitch: Selected demoday is not editable or has already started.'
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const { error } = await supabase.from('demoday_pitches').insert({
        demoday_id: selectedDemoday.id,
        idea_id: ideaId,
        pitcher_id: user.id,
      });
      if (error) throw error;
      setIsModalOpen(false);
      await fetchPitchesForDemoday(selectedDemoday.id);
    } catch (err: unknown) {
      console.error('Error submitting pitch:', err);
      setError(
        `Failed to submit pitch: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle pitch cancellation
  const handlePitchCancel = async (pitchId: string) => {
    if (!selectedMonth) return;
    const selectedDemoday = availableDemodays.find(
      (d) => d.event_date === selectedMonth
    );
    if (
      !selectedDemoday ||
      !isSelectedMonthEditable ||
      selectedDemoday.is_active
    ) {
      setError(
        'Cannot cancel pitch: Selected demoday is not editable or has already started.'
      );
      return;
    }

    setCancellingPitchId(pitchId);
    setError(null);
    try {
      const { error } = await supabase
        .from('demoday_pitches')
        .delete()
        .eq('id', pitchId);
      if (error) throw error;
      await fetchPitchesForDemoday(selectedDemoday.id);
    } catch (err: unknown) {
      console.error('Error cancelling pitch:', err);
      setError(
        `Failed to cancel pitch: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    } finally {
      setCancellingPitchId(null);
    }
  };

  // Handle demoday details update
  const handleDemodayDetailsUpdate = async (
    details: Record<string, unknown>
  ) => {
    if (!selectedMonth || !user) return;
    const selectedDemoday = availableDemodays.find(
      (d) => d.event_date === selectedMonth
    );
    if (!selectedDemoday) return;

    setIsProcessing(true);
    try {
      // Set host_id if it's currently null
      const updates: { details: Record<string, unknown>; host_id?: string } = {
        details,
      };
      if (selectedDemoday.host_id === null) {
        updates.host_id = user.id;
      }

      const { error } = await supabase
        .from('demodays')
        .update(updates)
        .eq('id', selectedDemoday.id);

      if (error) throw error;

      // Fetch the updated demoday to ensure we have the latest data
      const { data: updatedDemoday, error: fetchError } = await supabase
        .from('demodays')
        .select('*')
        .eq('id', selectedDemoday.id)
        .single();

      if (fetchError) throw fetchError;

      // Update local state with the fetched data
      const updatedDemodays = availableDemodays.map((d) =>
        d.id === selectedDemoday.id ? updatedDemoday : d
      );

      setAvailableDemodays(updatedDemodays);

      // Set isHost based on the updated demoday data
      setIsHost(user.id === updatedDemoday.host_id);

      setIsDetailsModalOpen(false);
    } catch (err) {
      console.error('Error updating demoday details:', err);
      setError(
        `Failed to update details: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle starting the demoday
  const handleStartDemoday = async () => {
    if (!selectedMonth || !user) return;
    const selectedDemoday = availableDemodays.find(
      (d) => d.event_date === selectedMonth
    );
    if (!selectedDemoday) return;

    setIsProcessing(true);

    try {
      // Ensure the user is set as host if no host exists yet
      if (selectedDemoday.host_id === null) {
        const { error: hostError } = await supabase
          .from('demodays')
          .update({ host_id: user.id })
          .eq('id', selectedDemoday.id);

        if (hostError) throw hostError;
      }

      // Start the demoday pitching phase
      const { error: rpcError } = await supabase.rpc('start_demoday_pitching', {
        demoday_id: selectedDemoday.id,
      });

      if (rpcError) throw rpcError;

      // Fetch the updated demoday to ensure we have the latest data
      const { data: updatedDemoday, error: fetchError } = await supabase
        .from('demodays')
        .select('*')
        .eq('id', selectedDemoday.id)
        .single();

      if (fetchError) throw fetchError;

      // Update local state with the fetched data
      const updatedDemodays = availableDemodays.map((d) =>
        d.id === selectedDemoday.id ? updatedDemoday : d
      );

      setAvailableDemodays(updatedDemodays);

      // Set isHost based on the updated demoday data
      setIsHost(user.id === updatedDemoday.host_id);

      // Fetch user balance for the current user after status change
      await fetchUserBalance(selectedDemoday.id, user.id);
    } catch (err) {
      console.error('Error starting demoday:', err);
      setError(
        `Failed to start demoday: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle calculating results
  const handleCalculateResults = async () => {
    if (!selectedMonth) return;
    const selectedDemoday = availableDemodays.find(
      (d) => d.event_date === selectedMonth
    );
    if (!selectedDemoday) return;

    setIsProcessing(true);
    try {
      console.log('Calculating results for demoday:', selectedDemoday.id);

      // Call the simplified calculate_demoday_results function
      const { data: results, error } = await supabase.rpc(
        'calculate_demoday_results',
        {
          p_demoday_id: selectedDemoday.id,
        }
      );

      console.log('Calculation function result:', {
        results,
        error,
      });

      if (error) {
        // Handle RPC call errors
        console.error('RPC call failed:', error);
        throw new Error(`RPC Error: ${error.message}`);
      }

      // Update local state
      console.log('Updating local state to completed.');
      const updatedDemodays = availableDemodays.map((d) =>
        d.id === selectedDemoday.id
          ? { ...d, status: 'completed' as DemodayStatus, is_active: false }
          : d
      );
      setAvailableDemodays(updatedDemodays);

      // Fetch the results
      console.log('Fetching results...');
      await fetchResultsForDemoday(selectedDemoday.id);

      // Fetch user balance
      if (user) {
        await fetchUserBalance(selectedDemoday.id, user.id);
      }

      console.log('Process completed.');
    } catch (err) {
      console.error('Final error in handleCalculateResults:', err);
      setError(
        `Failed to calculate results: ${err instanceof Error ? err.message : JSON.stringify(err)}`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle balance updates from funding section with memoization to prevent unnecessary rerenders
  const handleBalanceUpdate = useCallback((balance: UserBalance) => {
    // Only update state if the balance has actually changed
    // to avoid unnecessary re-renders
    setUserBalance((prevBalance) => {
      // If it's the same balance object or same values, don't update state
      if (
        prevBalance?.id === balance.id &&
        prevBalance?.remaining_balance === balance.remaining_balance
      ) {
        return prevBalance;
      }
      return balance;
    });
  }, []);

  // Get the currently selected demoday
  const selectedDemoday = selectedMonth
    ? availableDemodays.find((d) => d.event_date === selectedMonth)
    : null;

  // Determine if the user has already pitched for the selected month
  const userHasPitched = pitches.some((pitch) => pitch.pitcher_id === user?.id);

  // Determine if the selected month is editable (current or future)
  const isSelectedMonthEditable = selectedMonth
    ? !isPast(parseISO(selectedMonth)) ||
      isSameMonth(parseISO(selectedMonth), now)
    : false;

  // Render list of pitches with proper props based on status
  const renderPitchList = (isEditable: boolean) => {
    if (pitches.length === 0) {
      return (
        <p className="text-center text-muted-foreground py-6">
          No pitches submitted for {formatMonthForDisplay(selectedMonth)} yet.
        </p>
      );
    }

    return pitches.map((pitch, index) => (
      <PitchItem
        key={pitch.id}
        pitch={pitch}
        index={index}
        currentUser={user}
        onCancel={handlePitchCancel}
        isCancelling={cancellingPitchId === pitch.id}
        isEditable={isEditable}
      />
    ));
  };

  // Render demoday content based on status
  const renderDemodayContent = () => {
    if (!selectedDemoday) return null;

    const currentStatus = selectedDemoday.status;

    // Debug logging
    console.log('Rendering demoday content:', {
      status: currentStatus,
      demoday_id: selectedDemoday.id,
      userBalance,
      isAngel: userBalance?.is_angel,
      pitches: pitches.length,
    });

    // Show demoday details at the top for all phases
    const detailsSection = (
      <DemodayDetailsDisplay
        demoday={{
          ...selectedDemoday,
          details:
            selectedDemoday.details as import('@/types/demoday').DemodayDetails,
          status: selectedDemoday.status as DemodayStatus,
          is_active: selectedDemoday.is_active || false,
          created_at: selectedDemoday.created_at || new Date().toISOString(),
        }}
        isHost={isHost}
        onEditDetails={() => setIsDetailsModalOpen(true)}
      />
    );

    // Details section with event information
    <div className="flex justify-center w-full">{detailsSection}</div>;

    switch (currentStatus) {
      case 'upcoming':
        return (
          <div className="space-y-4">
            {detailsSection}

            {renderPitchList(
              isSelectedMonthEditable && !selectedDemoday.is_active
            )}

            <div className="mt-8 flex justify-center">
              {isHost && (
                <Button
                  onClick={handleStartDemoday}
                  disabled={isProcessing || pitches.length === 0}
                >
                  Start Demoday
                </Button>
              )}
            </div>
          </div>
        );

      case 'pitching':
        return (
          <div className="space-y-6">
            {detailsSection}

            {/* Show funding interface directly in pitching phase */}
            {user && (
              <FundingSection
                demoday={{
                  ...selectedDemoday,
                  details:
                    selectedDemoday.details as import('@/types/demoday').DemodayDetails,
                  status: selectedDemoday.status as DemodayStatus,
                  is_active: selectedDemoday.is_active || false,
                  created_at:
                    selectedDemoday.created_at || new Date().toISOString(),
                }}
                pitches={pitches}
                userBalance={userBalance}
                isHost={isHost}
                user={user}
                onCalculateResults={handleCalculateResults}
                onRefreshBalance={handleBalanceUpdate}
                isProcessing={isProcessing}
              />
            )}
          </div>
        );

      case 'completed':
        return (
          <div className="space-y-4">
            {detailsSection}

            {demodayResults ? (
              <ResultsSection
                results={demodayResults}
                currentUserId={user?.id}
              />
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Results not available</AlertTitle>
                <AlertDescription>
                  The results for this demoday are not available yet.
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Tabs outside the constrained container */}
      <div className="w-full">
        <div className="container mx-auto px-1">
          {availableDemodays.length > 0 && (
            <Tabs
              value={selectedMonth}
              onValueChange={handleMonthChange}
              className="w-full"
            >
              <TabsList className="flex flex-wrap w-full h-auto sm:w-auto sm:inline-flex sm:h-12">
                {availableDemodays.map((demoday) => (
                  <TabsTrigger
                    key={demoday.id}
                    value={demoday.event_date}
                    className="text-sm px-6 h-10"
                  >
                    {formatMonthForDisplay(demoday.event_date)}
                    {demoday.status === 'upcoming' && (
                      <span className="ml-1.5 text-xs text-blue-500">
                        (Upcoming)
                      </span>
                    )}
                    {demoday.status === 'pitching' && (
                      <span className="ml-1.5 text-xs text-orange-500">
                        (Pitching)
                      </span>
                    )}
                    {demoday.status === 'completed' && (
                      <span className="ml-1.5 text-xs text-green-500">
                        (Completed)
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
        </div>
      </div>

      {/* Main content area with max-width */}
      <div className="container mx-auto px-1 py-8 max-w-4xl">
        {/* Content Area - Loading/Error/Content */}
        <div className="space-y-4">
          {isLoading && !selectedMonth ? (
            <p className="text-center text-muted-foreground">
              Loading available months...
            </p>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : !selectedMonth ? (
            <p className="text-center text-muted-foreground">
              No Demodays found or scheduled.
            </p>
          ) : isLoading ? (
            <p className="text-center text-muted-foreground">
              Loading demoday data for {formatMonthForDisplay(selectedMonth)}...
            </p>
          ) : (
            renderDemodayContent()
          )}
        </div>

        {/* Submit Button Area (only visible in upcoming state, for users who haven't submitted) */}
        {user &&
          selectedMonth &&
          !isLoading &&
          selectedDemoday?.status === 'upcoming' && (
            <div className="mt-8 flex justify-center">
              {userHasPitched ? (
                <Button disabled variant="secondary">
                  Already Submitted for {formatMonthForDisplay(selectedMonth)}
                </Button>
              ) : (
                <Button
                  onClick={() => setIsModalOpen(true)}
                  disabled={
                    !isSelectedMonthEditable || selectedDemoday?.is_active
                  }
                >
                  Submit Idea to Pitch
                </Button>
              )}
            </div>
          )}

        {/* Pitch Submission Modal */}
        {user && (
          <PitchModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            ideas={userIdeas}
            onSubmit={handlePitchSubmit}
            isSubmitting={isSubmitting}
          />
        )}

        {/* Demoday Details Modal */}
        {selectedDemoday && (
          <DemodayDetailsForm
            isOpen={isDetailsModalOpen}
            onClose={() => setIsDetailsModalOpen(false)}
            initialDetails={selectedDemoday.details}
            onSubmit={handleDemodayDetailsUpdate}
            isSubmitting={isProcessing}
          />
        )}
      </div>
    </>
  );
}
