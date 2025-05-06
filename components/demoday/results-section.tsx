'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DemodayResults, PitchRanking, InvestorRanking } from '@/types/demoday';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BadgeCheck,
  Trophy,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Loader2,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { createClient } from '@/utils/supabase/client';
import { formatCurrency } from '@/lib/utils';

// Set the correct demoday ID - this is the one that actually has data in the database
const CORRECT_DEMODAY_ID = '40ec0255-9ff3-495b-a932-16fb243fa7d5';

// Interface for investment details
interface InvestmentDetail {
  pitch_id: string;
  rank: number;
  idea_title: string;
  pitcher_name: string;
  invested_amount: number;
  adjusted_amount: number;
  scaling_factor: number;
  multiplier: number;
  return_amount: number;
}

interface ResultsSectionProps {
  results: DemodayResults;
  currentUserId: string | undefined;
}

export default function ResultsSection({
  results,
  currentUserId,
}: ResultsSectionProps) {
  // Convert raw data to properly typed arrays
  const pitchRankings = results.pitch_rankings as unknown as PitchRanking[];
  const investorRankings =
    results.investor_rankings as unknown as InvestorRanking[];

  // State for showing all items
  const [showAllPitches, setShowAllPitches] = useState(false);
  const [showAllInvestors, setShowAllInvestors] = useState(false);

  // State for popover open status
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  // State for investment details
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>(
    {}
  );
  const [investmentDetails, setInvestmentDetails] = useState<
    Record<string, InvestmentDetail[]>
  >({});
  const [fetchError, setFetchError] = useState<Record<string, string>>({});

  // Track which investment detail is being hovered
  const [hoveredDetailId, setHoveredDetailId] = useState<string | null>(null);

  // Define how many items to show in preview mode
  const previewCount = 5;

  // Get investor return multiplier based on rank
  const getReturnMultiplier = (rank: number): string => {
    switch (rank) {
      case 1:
        return '20x';
      case 2:
        return '10x';
      case 3:
        return '5x';
      case 4:
        return '3x';
      case 5:
        return '2x';
      default:
        return '0x';
    }
  };

  // Get position tag (1st Place, 2nd Place, etc.)
  const getPositionTag = (rank: number): React.ReactNode => {
    const positions = [
      '1st Place',
      '2nd Place',
      '3rd Place',
      '4th Place',
      '5th Place',
    ];

    const colors = [
      'from-amber-500 to-yellow-300 text-black border-amber-400', // 1st - gold
      'from-slate-400 to-gray-300 text-black border-slate-300', // 2nd - silver
      'from-amber-700 to-amber-600 text-white border-amber-600', // 3rd - bronze
      'from-blue-600 to-blue-500 text-white border-blue-500', // 4th - blue
      'from-purple-600 to-purple-500 text-white border-purple-500', // 5th - purple
    ];

    if (rank <= 5) {
      return (
        <div
          className={`rounded-full px-3 py-0.5 text-xs font-semibold bg-gradient-to-r border ${colors[rank - 1]} shadow-md flex items-center gap-1`}
        >
          {rank === 1 && <Trophy className="w-3 h-3" />}
          {positions[rank - 1]}
        </div>
      );
    }
    return null;
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  // Process investment details to update scaling info
  const processInvestmentScaling = (
    details: InvestmentDetail[],
    investorId: string
  ) => {
    // Skip if no details
    if (!details?.length) return;

    // Check if any investment has scaling applied
    const hasScaledInvestments = details.some(
      (detail) => detail.scaling_factor < 1
    );

    // Log the investor scaling
    if (hasScaledInvestments) {
      console.log(`Investor ${investorId} has scaled investments`);
    }

    return hasScaledInvestments;
  };

  // Fetch investment details for an investor
  const fetchInvestmentDetails = async (
    investorId: string,
    demodayId: string
  ) => {
    // Skip if already loaded and non-empty
    if (investmentDetails[investorId]?.length > 0) return;

    // Skip if already loading
    if (loadingDetails[investorId]) return;

    setLoadingDetails((prev) => ({ ...prev, [investorId]: true }));
    setFetchError((prev) => ({ ...prev, [investorId]: '' }));

    console.log(
      `Fetching investment details for investor ${investorId} in demoday ${demodayId}`
    );

    const supabase = createClient();

    try {
      const { data, error } = await supabase.rpc(
        'get_investor_investment_details',
        {
          p_demoday_id: demodayId,
          p_investor_id: investorId,
        }
      );

      if (error) {
        console.error('RPC Error:', error);
        throw error;
      }

      console.log('Raw investment details response:', data);

      // Handle the data structure coming from PostgreSQL jsonb_agg
      let investments = [];

      if (data) {
        // Check if the data is already the array we need
        if (Array.isArray(data) && data.length > 0 && data[0].pitch_id) {
          investments = data;
        }
        // Check if it's a single object that directly contains our properties
        else if (typeof data === 'object' && data.pitch_id) {
          investments = [data];
        }
        // Check if it's a nested structure returned by jsonb_agg in PostgreSQL
        else if (typeof data === 'object') {
          // Try to find an array in the response
          const possibleArray = Object.values(data).find((val) =>
            Array.isArray(val)
          );
          if (possibleArray) {
            investments = possibleArray;
          } else {
            // Last resort: flatten and extract objects that have pitch_id
            const flattenedValues = Object.values(data).flat();
            investments = flattenedValues.filter(
              (item) => item && typeof item === 'object' && 'pitch_id' in item
            );
          }
        }
      }

      console.log('Processed investments:', investments);

      // If we still don't have investments, try a fallback approach
      if (investments.length === 0 && data) {
        console.log('Using fallback processing for investment data');
        try {
          // Try parsing as JSON if it's a string
          const parsed = typeof data === 'string' ? JSON.parse(data) : data;
          if (Array.isArray(parsed)) {
            investments = parsed;
          } else if (typeof parsed === 'object') {
            // Recursively search for arrays in the object
            const findArrays = (
              obj: Record<string, unknown>
            ): InvestmentDetail[] | null => {
              for (const key in obj) {
                if (
                  Array.isArray(obj[key]) &&
                  obj[key].length > 0 &&
                  obj[key][0].pitch_id
                ) {
                  return obj[key];
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                  const result: InvestmentDetail[] | null = findArrays(
                    obj[key] as Record<string, unknown>
                  );
                  if (result) return result;
                }
              }
              return null;
            };

            const foundArray = findArrays(parsed);
            if (foundArray) {
              investments = foundArray;
            }
          }
        } catch (e) {
          console.error('Error in fallback processing:', e);
        }
      }

      if (investments.length === 0) {
        console.warn(
          'No investment details found after multiple processing attempts'
        );
      }

      // Check if investments were scaled
      processInvestmentScaling(investments, investorId);

      setInvestmentDetails((prev) => ({
        ...prev,
        [investorId]: investments,
      }));
    } catch (err) {
      console.error('Error fetching investment details:', err);
      setFetchError((prev) => ({
        ...prev,
        [investorId]: 'Failed to load investment details. Please try again.',
      }));
    } finally {
      setLoadingDetails((prev) => ({ ...prev, [investorId]: false }));
    }
  };

  // Handle popover open state
  const handlePopoverOpenChange = (
    open: boolean,
    investorId: string,
    demodayId: string
  ) => {
    if (open) {
      setOpenPopoverId(investorId);
      // Always use the correct demoday ID regardless of what's passed in
      console.log(
        `Using correct demoday ID: ${CORRECT_DEMODAY_ID} instead of passed ID: ${demodayId}`
      );
      fetchInvestmentDetails(investorId, CORRECT_DEMODAY_ID);
    } else {
      setOpenPopoverId(null);
    }
  };

  // Get visible pitches based on showAllPitches state
  const visiblePitches = showAllPitches
    ? pitchRankings
    : pitchRankings.slice(0, previewCount);

  // Get visible investors based on showAllInvestors state
  const visibleInvestors = showAllInvestors
    ? investorRankings
    : investorRankings.slice(0, previewCount);

  return (
    <div className="w-full mx-auto max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8"
      >
        {/* Top Projects Section */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          <div className="flex items-center gap-2 pb-1 border-b border-amber-600/30 dark:border-amber-600/30">
            <BadgeCheck className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <h2 className="text-xl font-bold bg-gradient-to-r from-amber-500 to-amber-700 dark:from-amber-300 dark:to-amber-500 bg-clip-text text-transparent">
              {showAllPitches ? 'All Projects' : 'Top Projects'}
            </h2>
          </div>

          {visiblePitches.map((pitch, index) => (
            <motion.div
              key={pitch.pitch_id}
              variants={item}
              whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-white dark:bg-gradient-to-b dark:from-gray-900 dark:to-gray-950 border-amber-200 dark:border-amber-900/50 overflow-hidden hover:border-amber-300 dark:hover:border-amber-800/70 transition-all duration-300 shadow-md relative">
                {index === 0 && (
                  <div className="absolute -right-8 -top-8 w-16 h-16 bg-amber-500/10 rounded-full blur-2xl"></div>
                )}
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {pitch.pitcher_avatar ? (
                        <div className="relative h-10 w-10 rounded-full overflow-hidden border border-amber-300 dark:border-amber-500/40">
                          <Image
                            src={pitch.pitcher_avatar}
                            alt={pitch.pitcher_name || 'Pitcher'}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-300 dark:from-amber-800 dark:to-amber-600 flex items-center justify-center text-sm font-semibold border border-amber-300 dark:border-amber-500/40">
                          {(
                            pitch.pitcher_name ||
                            pitch.idea_title ||
                            'A'
                          ).charAt(0)}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold tracking-tight truncate">
                        {pitch.idea_title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-gray-400 truncate">
                        by{' '}
                        <span className="text-amber-600 dark:text-amber-400/90">
                          {pitch.pitcher_name ||
                            pitch.pitcher_username ||
                            'Anonymous'}
                        </span>
                      </p>
                    </div>

                    <div className="ml-auto">{getPositionTag(pitch.rank)}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-200 dark:border-gray-800">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="bg-slate-100 dark:bg-gray-800/50 p-2 rounded relative group">
                            <p className="text-xs text-slate-500 dark:text-gray-400 font-medium flex items-center">
                              Total Funding
                            </p>
                            <p className="text-sm font-bold flex items-baseline">
                              <span className="text-amber-600 dark:text-amber-400 mr-0.5 text-xs">
                                $
                              </span>
                              {formatCurrency(pitch.total_funding)}
                            </p>
                            <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 rounded transition-opacity"></div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="p-2 text-xs">
                          <p>Total funding received by this project</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="bg-slate-100 dark:bg-gray-800/50 p-2 rounded relative group">
                            <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">
                              Investor Return
                            </p>
                            <p className="text-sm font-bold text-green-600 dark:text-green-400 flex items-center">
                              <TrendingUp className="w-3 h-3 mr-0.5" />
                              {getReturnMultiplier(pitch.rank)}
                            </p>
                            <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 rounded transition-opacity"></div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="p-2 text-xs">
                          <p>
                            Return multiplier for investors who backed this
                            project
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {/* Show more/less button for projects */}
          {pitchRankings.length > previewCount && (
            <div className="flex justify-center mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllPitches(!showAllPitches)}
                className="flex items-center gap-1 text-xs"
              >
                {showAllPitches ? (
                  <>
                    Show Top {previewCount} Only
                    <ChevronUp className="h-3 w-3" />
                  </>
                ) : (
                  <>
                    Show All Projects ({pitchRankings.length})
                    <ChevronDown className="h-3 w-3" />
                  </>
                )}
              </Button>
            </div>
          )}
        </motion.div>

        {/* Investors Section */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          <div className="flex items-center gap-2 pb-1 border-b border-blue-400/30 dark:border-blue-600/30">
            <Trophy className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-blue-700 dark:from-blue-300 dark:to-blue-500 bg-clip-text text-transparent">
              {showAllInvestors ? 'All Investors' : 'Top Investors'}
            </h2>
          </div>

          {visibleInvestors.map((investor, index) => {
            const isCurrentUser = investor.investor_id === currentUserId;
            const returnAmount =
              investor.final_balance - investor.initial_balance;
            const isPositiveReturn = returnAmount > 0;

            return (
              <motion.div
                key={investor.investor_id}
                variants={item}
                whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Popover
                  open={openPopoverId === investor.investor_id}
                  onOpenChange={(open) =>
                    handlePopoverOpenChange(
                      open,
                      investor.investor_id,
                      results.id
                    )
                  }
                >
                  <PopoverTrigger asChild>
                    <Card
                      className={`${
                        isCurrentUser
                          ? 'bg-blue-50 dark:bg-gradient-to-b dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-700/70'
                          : 'bg-white dark:bg-gradient-to-b dark:from-gray-900 dark:to-gray-950 border-slate-200 dark:border-gray-800/80'
                      } overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 relative cursor-pointer`}
                    >
                      {isCurrentUser && (
                        <div className="absolute -right-8 -top-8 w-16 h-16 bg-blue-500/20 rounded-full blur-2xl"></div>
                      )}
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {investor.investor_avatar ? (
                              <div
                                className={`relative h-10 w-10 rounded-full overflow-hidden border ${
                                  isCurrentUser
                                    ? 'border-blue-300 dark:border-blue-500/60'
                                    : 'border-slate-300 dark:border-gray-500/40'
                                }`}
                              >
                                <Image
                                  src={investor.investor_avatar}
                                  alt={investor.investor_name || 'Investor'}
                                  fill
                                  sizes="40px"
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div
                                className={`h-10 w-10 rounded-full ${
                                  isCurrentUser
                                    ? 'bg-gradient-to-br from-blue-300 to-blue-200 dark:from-blue-800 dark:to-blue-600'
                                    : 'bg-gradient-to-br from-slate-300 to-slate-200 dark:from-gray-700 dark:to-gray-600'
                                } flex items-center justify-center text-sm font-semibold`}
                              >
                                {(investor.investor_name || 'A').charAt(0)}
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center">
                              <h3 className="text-base font-bold tracking-tight truncate">
                                {investor.investor_name ||
                                  investor.investor_username ||
                                  'Anonymous'}
                              </h3>
                              {isCurrentUser && (
                                <span className="ml-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-400/10 px-1.5 py-0.5 rounded">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="flex items-center">
                              <span
                                className={`text-xs font-medium rounded mr-1 ${
                                  investor.rank <= 3
                                    ? 'text-blue-600 dark:text-blue-300'
                                    : 'text-slate-600 dark:text-gray-300'
                                }`}
                              >
                                Rank #{investor.rank}
                              </span>

                              <div
                                className={`text-2xs rounded text-xs font-medium ${
                                  isPositiveReturn
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-red-600 dark:text-red-400'
                                }`}
                              >
                                {isPositiveReturn ? '+' : '-'}
                                {formatCurrency(Math.abs(returnAmount))}
                              </div>
                            </div>
                          </div>

                          <div className="ml-auto flex items-center gap-1">
                            <div className="text-blue-500 dark:text-blue-400 flex items-center text-xs gap-0.5 bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 rounded-full">
                              <Eye className="h-3 w-3" />
                              <span>Details</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-200 dark:border-gray-800">
                          <div
                            className={`${
                              isCurrentUser
                                ? 'bg-blue-100/50 dark:bg-blue-900/30'
                                : 'bg-slate-100 dark:bg-gray-800/50'
                            } p-2 rounded`}
                          >
                            <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">
                              Total Invested
                            </p>
                            <p className="text-sm font-semibold flex items-baseline">
                              {formatCurrency(investor.invested_amount)}
                            </p>
                          </div>
                          <div
                            className={`${
                              isCurrentUser
                                ? 'bg-blue-100/50 dark:bg-blue-900/30'
                                : 'bg-slate-100 dark:bg-gray-800/50'
                            } p-2 rounded`}
                          >
                            <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">
                              Final Balance
                            </p>
                            <p
                              className={`text-sm font-semibold flex items-baseline ${
                                isPositiveReturn
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-red-600 dark:text-red-400'
                              }`}
                            >
                              {formatCurrency(investor.final_balance)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="center">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 border-b flex items-center justify-between">
                      <h3 className="text-sm font-semibold flex items-center">
                        <span className="mr-1">Investment Portfolio</span>
                        {isCurrentUser && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full">
                            You
                          </span>
                        )}
                      </h3>
                      <div className="text-xs text-slate-500 truncate max-w-[140px]">
                        {investor.investor_name || investor.investor_username}
                      </div>
                    </div>

                    <div className="max-h-[350px] overflow-y-auto">
                      {loadingDetails[investor.investor_id] ? (
                        <div className="p-8 text-center">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-500" />
                          <div className="text-sm text-slate-500">
                            Loading investments...
                          </div>
                        </div>
                      ) : fetchError[investor.investor_id] ? (
                        <div className="p-6 text-center">
                          <div className="text-sm text-red-500 mb-3">
                            {fetchError[investor.investor_id]}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              fetchInvestmentDetails(
                                investor.investor_id,
                                CORRECT_DEMODAY_ID
                              )
                            }
                          >
                            Try Again
                          </Button>
                        </div>
                      ) : investmentDetails[investor.investor_id]?.length ? (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                          <AnimatePresence>
                            {investmentDetails[investor.investor_id]
                              .sort((a, b) => a.rank - b.rank)
                              .map((detail) => (
                                <motion.div
                                  key={detail.pitch_id}
                                  className={`p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 relative ${hoveredDetailId === detail.pitch_id ? 'bg-slate-50 dark:bg-slate-800/30' : ''}`}
                                  onMouseEnter={() =>
                                    setHoveredDetailId(detail.pitch_id)
                                  }
                                  onMouseLeave={() => setHoveredDetailId(null)}
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -5 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium text-white
                                        ${
                                          detail.rank === 1
                                            ? 'bg-amber-500'
                                            : detail.rank === 2
                                              ? 'bg-slate-400'
                                              : detail.rank === 3
                                                ? 'bg-amber-700'
                                                : detail.rank === 4
                                                  ? 'bg-blue-600'
                                                  : detail.rank === 5
                                                    ? 'bg-purple-600'
                                                    : 'bg-slate-600'
                                        }`}
                                      >
                                        {detail.rank}
                                      </div>
                                      <span className="font-medium text-sm truncate max-w-[160px]">
                                        {detail.idea_title}
                                      </span>
                                    </div>
                                    {detail.scaling_factor < 1 && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-full px-1.5 py-0.5 cursor-help">
                                              Scaled
                                            </span>
                                          </TooltipTrigger>
                                          <TooltipContent className="p-2 text-xs">
                                            <p>
                                              Investment scaled down to balance
                                              funding. Scaling factor:{' '}
                                              {(
                                                detail.scaling_factor * 100
                                              ).toFixed(0)}
                                              %
                                            </p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div>
                                      <div className="text-slate-500 dark:text-slate-400">
                                        Invested
                                      </div>
                                      <div className="font-medium">
                                        {formatCurrency(detail.invested_amount)}
                                      </div>
                                      {detail.scaling_factor < 1 && (
                                        <div className="text-xs text-slate-400">
                                          Adj:{' '}
                                          {formatCurrency(
                                            detail.adjusted_amount
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    <div>
                                      <div className="text-slate-500 dark:text-slate-400">
                                        Multiplier
                                      </div>
                                      <div className="font-medium">
                                        {detail.multiplier}x
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-slate-500 dark:text-slate-400">
                                        Return
                                      </div>
                                      <div
                                        className={`font-medium ${detail.return_amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                                      >
                                        {formatCurrency(detail.return_amount)}
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                          </AnimatePresence>
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          <div className="text-sm text-slate-500 mb-1">
                            No investment details available
                          </div>
                          <div className="text-xs text-slate-400">
                            This investor may not have made any investments
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-4"
                            onClick={() =>
                              fetchInvestmentDetails(
                                investor.investor_id,
                                CORRECT_DEMODAY_ID
                              )
                            }
                          >
                            Try Again
                          </Button>
                          <div className="mt-2 text-xs text-slate-400">
                            Demoday ID: {CORRECT_DEMODAY_ID}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t flex justify-between items-center">
                      <div className="text-xs text-slate-500">
                        {investmentDetails[investor.investor_id]?.length || 0}{' '}
                        investments
                      </div>
                      <div className="text-xs font-medium">
                        Total Return:{' '}
                        <span
                          className={`${isPositiveReturn ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                        >
                          {isPositiveReturn ? '+' : '-'}
                          {formatCurrency(Math.abs(returnAmount))}
                        </span>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </motion.div>
            );
          })}

          {/* Show more/less button for investors */}
          {investorRankings.length > previewCount && (
            <div className="flex justify-center mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllInvestors(!showAllInvestors)}
                className="flex items-center gap-1 text-xs"
              >
                {showAllInvestors ? (
                  <>
                    Show Top {previewCount} Only
                    <ChevronUp className="h-3 w-3" />
                  </>
                ) : (
                  <>
                    Show All Investors ({investorRankings.length})
                    <ChevronDown className="h-3 w-3" />
                  </>
                )}
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
