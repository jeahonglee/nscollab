'use client';

import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, startOfMonth, addMonths, parseISO, isPast, isSameMonth } from 'date-fns'; // Import date-fns helpers
import PitchItem from './pitch-item';
import PitchModal from './pitch-modal';
import { AlertCircle } from 'lucide-react';

// Placeholder types - replace with actual types later
interface RawPitchData {
  id: string;
  idea_id: string;
  pitcher_id: string;
  submitted_at: string;
  ideas: { id: string; title: string; description: string }[] | null;
  profiles: { id: string; full_name: string | null; avatar_url: string | null; discord_username: string | null }[] | null;
}

type Pitch = {
  id: string;
  idea_id: string;
  pitcher_id: string;
  ideas: { title: string; description: string };
  profiles: { id: string; full_name: string | null; avatar_url: string | null; discord_username: string | null };
  submitted_at: string;
};
type Idea = { id: string; title: string };
type DemodayEntry = { id: string; event_date: string };

interface DemodayContentProps {
  serverUser: User | null;
}

// Helper function to format date for display
const formatMonthForDisplay = (dateString: string): string => {
  try {
    return format(parseISO(dateString), 'MMM yyyy');
  } catch (e) {
    console.error("Error parsing date for display:", dateString, e);
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
  const [availableDemodays, setAvailableDemodays] = useState<DemodayEntry[]>([]); // Store fetched demodays
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancellingPitchId, setCancellingPitchId] = useState<string | null>(null);

  // Determine current and next month start dates for querying
  const now = new Date();
  const currentMonthStartDate = startOfMonth(now);
  const nextMonthStartDate = startOfMonth(addMonths(now, 1));
  const currentMonthQueryStr = formatMonthForQuery(currentMonthStartDate);
  const nextMonthQueryStr = formatMonthForQuery(nextMonthStartDate);

  // Fetch available Demodays and Pitches for the initially selected month
  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch existing/relevant Demoday entries (e.g., current and next month)
      const { data: demodayData, error: demodayError } = await supabase
        .from('demodays')
        .select('id, event_date')
        .in('event_date', [currentMonthQueryStr, nextMonthQueryStr]) // Check current & next
        .order('event_date', { ascending: true });

      if (demodayError) throw demodayError;

      const fetchedDemodays = demodayData || [];
      let initialSelectedDemoday: DemodayEntry | null = null;

      // Ensure current month entry exists, create if not (if needed later)
      // For now, just use fetched data. We might need to add creation logic back
      // depending on if we *always* want current/next month tabs visible.

      // Sort fetched demodays just in case DB order isn't guaranteed
      fetchedDemodays.sort((a, b) => a.event_date.localeCompare(b.event_date));
      setAvailableDemodays(fetchedDemodays);

      // Determine initial tab selection (prefer future/current)
      const futureOrCurrentDemoday = fetchedDemodays.find(d => !isPast(parseISO(d.event_date)) || isSameMonth(parseISO(d.event_date), now));
      initialSelectedDemoday = futureOrCurrentDemoday || fetchedDemodays[fetchedDemodays.length - 1] || null;

      if (initialSelectedDemoday) {
        setSelectedMonth(initialSelectedDemoday.event_date);
        await fetchPitchesForMonth(initialSelectedDemoday.id);
      } else {
        setPitches([]); // No demodays found, no pitches to show
      }

      // Fetch user's ideas for the modal (only if logged in)
      if (user) {
        await fetchUserIdeas(user.id);
      }
    } catch (err: unknown) {
      console.error('Full error fetching initial demoday data:', JSON.stringify(err, null, 2));
      setError(`Failed to load initial data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setPitches([]);
      setAvailableDemodays([]);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, user?.id, currentMonthQueryStr, nextMonthQueryStr]); // Dependencies

  // Fetch pitches when selectedMonth changes
  const fetchPitchesForMonth = async (demodayId: string) => {
    // Fetch pitches for the given demoday ID (similar to previous fetchPitches logic)
    // This function replaces the pitch-fetching part of the old fetchPitches
    setIsLoading(true); // Show loading for pitches specifically
    try {
      const { data: pitchData, error: pitchError } = await supabase
          .from('demoday_pitches')
          .select(`
            id,
            idea_id,
            pitcher_id,
            submitted_at,
            ideas ( id, title, description ),
            profiles ( id, full_name, avatar_url, discord_username )
          `)
          .eq('demoday_id', demodayId)
          .order('submitted_at', { ascending: true });

      if (pitchError) throw pitchError;

      // Transform data to match Pitch type
      const transformedPitches: Pitch[] = (pitchData || []).map((p: RawPitchData) => ({
        ...p,
        // Safely access the first element or provide defaults
        ideas: p.ideas?.[0] || { title: 'Unknown Idea', description: '' }, 
        profiles: p.profiles?.[0] || { id: '', full_name: 'Unknown User', avatar_url: null, discord_username: null }, 
      }));

      setPitches(transformedPitches);
      setError(null);
    } catch (err: unknown) {
       console.error('Full error fetching pitches for month:', JSON.stringify(err, null, 2));
       setError(`Failed to load pitches: ${err instanceof Error ? err.message : 'Unknown error'}`);
       setPitches([]);
    } finally {
        setIsLoading(false);
    }
  };

  // Fetch user's ideas
  const fetchUserIdeas = useCallback(async (userId: string) => {
     // ... (fetch user ideas logic remains the same)
      const { data: memberData, error: memberError } = await supabase
        .from('idea_members')
        .select('idea_id')
        .eq('user_id', userId);

      if (memberError) throw memberError;
      const ideaIds = memberData?.map(m => m.idea_id) || [];

      if (ideaIds.length === 0) {
        setUserIdeas([]);
        return;
      }

      const { data: ideaData, error: ideaError } = await supabase
        .from('ideas')
        .select('id, title, description') // Fetch description here too if needed by modal
        .in('id', ideaIds);

      if (ideaError) throw ideaError;
      setUserIdeas(ideaData || []);
     // ...
  }, [supabase]);

  // Handle month tab change
  const handleMonthChange = (newMonthValue: string) => {
    const selectedDemoday = availableDemodays.find(d => d.event_date === newMonthValue);
    if (selectedDemoday) {
      setSelectedMonth(newMonthValue);
      fetchPitchesForMonth(selectedDemoday.id);
    } else {
      console.warn(`No demoday found for event_date: ${newMonthValue}`);
      // Optionally clear pitches or show an error
      setPitches([]);
    }
  };

  // Initial data fetch on component mount
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Handle pitch submission
  const handlePitchSubmit = async (ideaId: string) => {
    if (!user || !selectedMonth) return;
    const selectedDemoday = availableDemodays.find(d => d.event_date === selectedMonth);
    if (!selectedDemoday || !isSelectedMonthEditable) {
        setError("Cannot submit pitch: Selected demoday not found or is not editable.");
        return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const { error } = await supabase.from('demoday_pitches').insert({
        demoday_id: selectedDemoday.id, // Use the actual demoday ID
        idea_id: ideaId,
        pitcher_id: user.id,
      });
      if (error) throw error;
      setIsModalOpen(false);
      await fetchPitchesForMonth(selectedDemoday.id); // Refresh pitches for the current month
    } catch (err: unknown) {
      console.error('Error submitting pitch:', err);
      setError(`Failed to submit pitch: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle pitch cancellation
  const handlePitchCancel = async (pitchId: string) => {
    if (!selectedMonth) return;
    const selectedDemoday = availableDemodays.find(d => d.event_date === selectedMonth);
    if (!selectedDemoday || !isSelectedMonthEditable) {
        setError("Cannot cancel pitch: Selected demoday not found or is not editable.");
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
      await fetchPitchesForMonth(selectedDemoday.id); // Refresh pitches
    } catch (err: unknown) {
      console.error('Error cancelling pitch:', err);
      setError(`Failed to cancel pitch: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setCancellingPitchId(null);
    }
  };

  // Determine if the user has already pitched for the selected month
  const userHasPitched = pitches.some(pitch => pitch.pitcher_id === user?.id);

  // **Determine if the selected month is editable (current or future)**
  const isSelectedMonthEditable = selectedMonth ? !isPast(parseISO(selectedMonth)) || isSameMonth(parseISO(selectedMonth), now) : false;

  return (
    <>
       {/* Tabs outside the constrained container */}
      <div className="w-full">
         <div className="container mx-auto px-4">
             {availableDemodays.length > 0 && (
                  <Tabs value={selectedMonth} onValueChange={handleMonthChange} className="w-full">
                    <TabsList className="flex flex-wrap w-full h-auto sm:w-auto sm:inline-flex sm:h-12">
                       {availableDemodays.map(demoday => (
                         <TabsTrigger key={demoday.id} value={demoday.event_date} className="text-sm px-6 h-10">
                             {formatMonthForDisplay(demoday.event_date)}
                             {!isPast(parseISO(demoday.event_date)) && !isSameMonth(parseISO(demoday.event_date), now) && (
                                 <span className="ml-1.5 text-xs text-blue-500">(Upcoming)</span>
                             )}
                         </TabsTrigger>
                       ))}
                    </TabsList>
                 </Tabs>
            )}
        </div>
      </div>

       {/* Main content area with max-width */}
       <div className="container mx-auto px-4 py-8 max-w-4xl">
         {/* Content Area - Loading/Error/Pitches */}
         <div className="space-y-4">
           {isLoading && !selectedMonth ? (
             <p className="text-center text-muted-foreground">Loading available months...</p>
           ) : error ? (
             <Alert variant="destructive">
               <AlertCircle className="h-4 w-4" />
               <AlertTitle>Error</AlertTitle>
               <AlertDescription>{error}</AlertDescription>
             </Alert>
           ) : !selectedMonth ? (
              <p className="text-center text-muted-foreground">No Demodays found or scheduled.</p>
           ) : isLoading ? (
              <p className="text-center text-muted-foreground">Loading pitches for {formatMonthForDisplay(selectedMonth)}...</p>
           ) : pitches.length === 0 ? (
             <p className="text-center text-muted-foreground py-6">
               No pitches submitted for {formatMonthForDisplay(selectedMonth)} yet.
             </p>
           ) : (
             pitches.map((pitch, index) => (
               <PitchItem
                 key={pitch.id}
                 pitch={pitch}
                 index={index}
                 currentUser={user}
                 onCancel={handlePitchCancel}
                 isCancelling={cancellingPitchId === pitch.id}
                 isEditable={isSelectedMonthEditable} // Pass editability flag
               />
             ))
           )}
         </div>

         {/* Submit Button Area */}
         {user && selectedMonth && !isLoading && (
           <div className="mt-8 flex justify-center">
             {userHasPitched ? (
               <Button disabled variant="secondary">
                 Already Submitted for {formatMonthForDisplay(selectedMonth)}
               </Button>
             ) : (
               <Button
                 onClick={() => setIsModalOpen(true)}
                 disabled={!isSelectedMonthEditable} // Disable button if not editable
               >
                 Submit Idea to Pitch
               </Button>
             )}
           </div>
         )}

         {/* Pitch Submission Modal (Rendered regardless of editability, internal logic handles submission) */}
         {user && (
           <PitchModal
             isOpen={isModalOpen}
             onClose={() => setIsModalOpen(false)}
             ideas={userIdeas}
             onSubmit={handlePitchSubmit}
             isSubmitting={isSubmitting}
           />
         )}
       </div>
    </>
  );
}
