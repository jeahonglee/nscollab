'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { format, startOfMonth, addMonths, subDays, isBefore, parseISO } from 'date-fns';
import PitchItem from './pitch-item';
import PitchModal from './pitch-modal';

// Placeholder types - replace with actual types later
type Pitch = {
  id: string;
  idea_id: string;
  pitcher_id: string;
  ideas: { title: string };
  profiles: { id: string; full_name: string | null; avatar_url: string | null; discord_username: string | null };
  submitted_at: string;
};
type Idea = { id: string; title: string };

interface DemodayContentProps {
  serverUser: User | null;
}

export default function DemodayContent({ serverUser }: DemodayContentProps) {
  const [user] = useState(serverUser);
  const [availableMonths, setAvailableMonths] = useState<Date[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(''); // Store as 'YYYY-MM-DD'
  const [pitches, setPitches] = useState<Pitch[]>([]); // Pitches for the selected month
  const [userIdeas, setUserIdeas] = useState<Idea[]>([]); // User's own ideas for the modal
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState<string | null>(null); // Store pitch ID being cancelled
  const [showPitchModal, setShowPitchModal] = useState(false);

  const supabase = createClient();

  // Determine current and next month logic
  const currentMonthStart = useMemo(() => startOfMonth(new Date()), []);
  const nextMonthStart = useMemo(() => addMonths(currentMonthStart, 1), [currentMonthStart]);
  const showNextMonthThreshold = useMemo(() => subDays(nextMonthStart, 7), [nextMonthStart]);

  const userHasSubmitted = useMemo(() => {
    if (!user) return false;
    return pitches.some(pitch => pitch.pitcher_id === user.id);
  }, [pitches, user]);

  // Generate month tabs
  useEffect(() => {
    const today = new Date();
    // TODO: Fetch historical months from demodays table if needed
    // For now, just show current and potentially next month
    const monthsToShow: Date[] = [currentMonthStart];
    if (isBefore(showNextMonthThreshold, today)) {
      monthsToShow.push(nextMonthStart);
    }
    setAvailableMonths(monthsToShow);
    // Default to the latest available month (usually current or next)
    setSelectedMonth(format(monthsToShow[monthsToShow.length - 1], 'yyyy-MM-dd'));
  }, [currentMonthStart, nextMonthStart, showNextMonthThreshold]);

  // Fetch pitches for the selected month
  const fetchPitches = useCallback(async (month: string) => {
    if (!month) return;
    setIsLoading(true);
    setError(null);
    try {
      // 1. Find or create the demoday entry for the selected month
      const eventDate = month; // Already in YYYY-MM-DD format
      let { data: demoday, error: demodayError } = await supabase
        .from('demodays')
        .select('id')
        .eq('event_date', eventDate)
        .single();

      // If demoday doesn't exist for an *upcoming* month, create it
      if (!demoday && !isBefore(parseISO(eventDate), currentMonthStart)) {
        const { data: newDemoday, error: insertError } = await supabase
          .from('demodays')
          .insert({ event_date: eventDate })
          .select('id')
          .single();
        if (insertError) throw insertError;
        demoday = newDemoday;
      }

      if (demodayError && demodayError.code !== 'PGRST116') {
        // Ignore 'PGRST116' (single row not found) if it's a past month
        if (isBefore(parseISO(eventDate), currentMonthStart)) {
          console.log(`No demoday record found for past month: ${eventDate}`);
          setPitches([]); // No pitches if no demoday record for past month
        } else {
            throw demodayError;
        }
      }

      // 2. Fetch pitches if the demoday exists
      if (demoday?.id) {
        const { data: pitchData, error: pitchError } = await supabase
          .from('demoday_pitches')
          .select(`
            id,
            idea_id,
            pitcher_id,
            submitted_at,
            ideas ( id, title ),
            profiles ( id, full_name, avatar_url, discord_username )
          `)
          .eq('demoday_id', demoday.id)
          .order('submitted_at', { ascending: true });

        if (pitchError) throw pitchError;
        setPitches(pitchData as Pitch[] || []);
      } else if (isBefore(parseISO(eventDate), currentMonthStart)) {
        // Ensure pitches are cleared if viewing a past month without a record
        setPitches([]);
      }

    } catch (err: any) {
      console.error('Full error fetching demoday pitches:', JSON.stringify(err, null, 2)); // Log the full error object
      setError(`Failed to load pitches: ${err.message || 'Unknown error'}`); // Add fallback message
      setPitches([]);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, currentMonthStart]);

  // Fetch user's ideas when the modal is needed
  const fetchUserIdeas = useCallback(async () => {
    if (!user) return;
    try {
      // Fetch ideas where the user is a member
      const { data: memberData, error: memberError } = await supabase
        .from('idea_members')
        .select('idea_id')
        .eq('user_id', user.id);

      if (memberError) throw memberError;
      if (!memberData || memberData.length === 0) {
          setUserIdeas([]);
          return;
      }

      const ideaIds = memberData.map(m => m.idea_id);

      const { data: ideaData, error: ideaError } = await supabase
        .from('ideas')
        .select('id, title')
        .in('id', ideaIds);

      if (ideaError) throw ideaError;
      setUserIdeas(ideaData || []);
    } catch (err: any) {
      console.error('Error fetching user ideas:', err);
      // Handle error appropriately, maybe show a message in the modal
    }
  }, [user, supabase]);

  // Effect to fetch pitches when selected month changes
  useEffect(() => {
    if (selectedMonth) {
      fetchPitches(selectedMonth);
    }
  }, [selectedMonth, fetchPitches]);

  // --- Action Handlers ---
  const handleOpenPitchModal = () => {
    fetchUserIdeas(); // Fetch ideas right before showing
    setShowPitchModal(true);
  };

  const handlePitchSubmit = async (selectedIdeaId: string) => {
    if (!user || !selectedMonth || !selectedIdeaId) return;

    setIsSubmitting(true);
    setError(null);
    try {
      // Find demoday ID again (could be cached, but safer to re-fetch)
       const { data: demoday, error: demodayError } = await supabase
        .from('demodays')
        .select('id')
        .eq('event_date', selectedMonth)
        .single();

       if (demodayError || !demoday) {
           throw new Error('Demoday event not found for submission.');
       }

      // Insert the pitch
      const { error: insertError } = await supabase
        .from('demoday_pitches')
        .insert({
          demoday_id: demoday.id,
          idea_id: selectedIdeaId,
          pitcher_id: user.id,
        });

      if (insertError) {
        if (insertError.code === '23505') { // unique constraint violation
          throw new Error('You have already submitted a pitch for this month.');
        } else {
          throw insertError;
        }
      }

      // Success
      setShowPitchModal(false);
      await fetchPitches(selectedMonth); // Refresh pitch list
    } catch (err: any) {
      console.error('Error submitting pitch:', err);
      setError(`Submission failed: ${err.message}`);
      // Keep modal open on error? Or close and show alert?
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelPitch = async (pitchId: string) => {
    if (!pitchId) return;
    setIsCancelling(pitchId);
    setError(null);
    try {
      const { error } = await supabase
        .from('demoday_pitches')
        .delete()
        .eq('id', pitchId);

      if (error) throw error;

      // Refresh pitch list on success
      await fetchPitches(selectedMonth);
    } catch (err: any) {
      console.error('Error cancelling pitch:', err);
      setError(`Failed to cancel pitch: ${err.message}`);
    } finally {
      setIsCancelling(null);
    }
  };

  // --- Rendering ---

  const renderPitches = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (pitches.length === 0) {
      return (
        <p className="text-muted-foreground italic py-4 text-center">
          No pitches submitted for {format(parseISO(selectedMonth), 'MMMM yyyy')} yet.
        </p>
      );
    }

    return (
      <div className="space-y-3 py-4">
        {pitches.map((pitch, index) => (
          <PitchItem
            key={pitch.id}
            pitch={pitch}
            index={index}
            currentUser={user}
            onCancel={handleCancelPitch}
            isCancelling={isCancelling === pitch.id}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="w-full">
      <Tabs
        value={selectedMonth}
        onValueChange={setSelectedMonth}
        className="w-full"
      >
        <TabsList className="mb-4">
          {availableMonths.map((monthDate) => {
            const monthValue = format(monthDate, 'yyyy-MM-dd');
            return (
              <TabsTrigger key={monthValue} value={monthValue}>
                {format(monthDate, 'MMM yyyy')}
                {monthDate.getTime() === nextMonthStart.getTime() && ( // Check if it's the next month
                  <span className="ml-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">(Upcoming)</span>
                )}
              </TabsTrigger>
            );
          })}
          {/* Add more tabs here if fetching historical data */}
        </TabsList>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {availableMonths.map((monthDate) => {
          const monthValue = format(monthDate, 'yyyy-MM-dd');
          return (
            <TabsContent key={monthValue} value={monthValue}>
              {renderPitches()}
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Only show submit button for upcoming/current month */}
      {selectedMonth && !isBefore(parseISO(selectedMonth), currentMonthStart) && (
         <div className="mt-6">
            <Button
              onClick={handleOpenPitchModal}
              disabled={!user || userHasSubmitted || isLoading}
              size="lg"
            >
              {userHasSubmitted ? 'Already Submitted for this Month' : 'Submit Idea to Pitch'}
            </Button>
            {!user && (
                <p className="text-sm text-muted-foreground mt-2">You need to be logged in to submit a pitch.</p>
            )}
         </div>
      )}

      {/* Use the actual Pitch Modal Component */}
      <PitchModal
        isOpen={showPitchModal}
        onClose={() => setShowPitchModal(false)}
        ideas={userIdeas}
        onSubmit={handlePitchSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
