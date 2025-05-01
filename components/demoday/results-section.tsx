'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DemodayResults, PitchRanking, InvestorRanking } from '@/types/demoday';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { BadgeCheck, Trophy, TrendingUp } from 'lucide-react';

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

  // Format large numbers with commas
  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('en-US');
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
          <div className="flex items-center gap-2 pb-1 border-b border-amber-600/30">
            <BadgeCheck className="w-4 h-4 text-amber-400" />
            <h2 className="text-xl font-bold bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
              Top Projects
            </h2>
          </div>

          {pitchRankings.slice(0, 5).map((pitch, index) => (
            <motion.div
              key={pitch.pitch_id}
              variants={item}
              whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
            >
              <Card className="bg-gradient-to-b from-gray-900 to-gray-950 border-amber-900/50 overflow-hidden hover:border-amber-800/70 transition-all duration-300 shadow-md relative">
                {index === 0 && (
                  <div className="absolute -right-8 -top-8 w-16 h-16 bg-amber-500/10 rounded-full blur-2xl"></div>
                )}
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {pitch.pitcher_avatar ? (
                        <div className="relative h-10 w-10 rounded-full overflow-hidden border border-amber-500/40">
                          <Image
                            src={pitch.pitcher_avatar}
                            alt={pitch.pitcher_name || 'Pitcher'}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-800 to-amber-600 flex items-center justify-center text-sm font-semibold border border-amber-500/40">
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
                      <p className="text-xs text-gray-400 truncate">
                        by{' '}
                        <span className="text-amber-400/90">
                          {pitch.pitcher_name ||
                            pitch.pitcher_username ||
                            'Anonymous'}
                        </span>
                      </p>
                    </div>

                    <div className="ml-auto">{getPositionTag(pitch.rank)}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-800">
                    <div className="bg-gray-800/50 p-2 rounded">
                      <p className="text-xs text-gray-400 font-medium">
                        Total Funding
                      </p>
                      <p className="text-sm font-bold flex items-baseline">
                        <span className="text-amber-400 mr-0.5 text-xs">$</span>
                        {formatCurrency(pitch.total_funding)}
                      </p>
                    </div>
                    <div className="bg-gray-800/50 p-2 rounded">
                      <p className="text-xs text-gray-400 font-medium">
                        Investor Return
                      </p>
                      <p className="text-sm font-bold text-green-400 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-0.5" />
                        {getReturnMultiplier(pitch.rank)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Top Investors Section */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          <div className="flex items-center gap-2 pb-1 border-b border-blue-600/30">
            <Trophy className="w-4 h-4 text-blue-400" />
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-300 to-blue-500 bg-clip-text text-transparent">
              Top Investors
            </h2>
          </div>

          {investorRankings.slice(0, 5).map((investor) => {
            const isCurrentUser = investor.investor_id === currentUserId;
            const returnAmount =
              investor.final_balance - investor.initial_balance;
            const isPositiveReturn = returnAmount > 0;

            return (
              <motion.div
                key={investor.investor_id}
                variants={item}
                whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
              >
                <Card
                  className={`${
                    isCurrentUser
                      ? 'bg-gradient-to-b from-blue-950 to-blue-900 border-blue-700/70'
                      : 'bg-gradient-to-b from-gray-900 to-gray-950 border-gray-800/80'
                  } overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 relative`}
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
                                ? 'border-blue-500/60'
                                : 'border-gray-500/40'
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
                                ? 'bg-gradient-to-br from-blue-800 to-blue-600'
                                : 'bg-gradient-to-br from-gray-700 to-gray-600'
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
                            <span className="ml-1 text-xs font-medium text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded">
                              You
                            </span>
                          )}
                        </div>
                        <div className="flex items-center">
                          <span
                            className={`text-xs font-medium rounded mr-1 ${
                              investor.rank <= 3
                                ? 'text-blue-300'
                                : 'text-gray-300'
                            }`}
                          >
                            Rank #{investor.rank}
                          </span>

                          <div
                            className={`text-2xs rounded text-xs font-medium ${
                              isPositiveReturn
                                ? 'text-green-400'
                                : 'text-red-400'
                            }`}
                          >
                            {isPositiveReturn ? '+' : '-'}$
                            {formatCurrency(Math.abs(returnAmount))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-800">
                      <div
                        className={`bg-gray-800/50 p-2 rounded ${isCurrentUser ? 'bg-blue-900/30' : ''}`}
                      >
                        <p className="text-xs text-gray-400 font-medium">
                          Initial
                        </p>
                        <p className="text-sm font-semibold flex items-baseline">
                          <span
                            className={`text-xs ${isCurrentUser ? 'text-blue-400' : 'text-gray-400'}`}
                          >
                            $
                          </span>
                          {formatCurrency(investor.initial_balance)}
                        </p>
                      </div>
                      <div
                        className={`bg-gray-800/50 p-2 rounded ${isCurrentUser ? 'bg-blue-900/30' : ''}`}
                      >
                        <p className="text-xs text-gray-400 font-medium">
                          Invested
                        </p>
                        <p className="text-sm font-semibold flex items-baseline">
                          <span
                            className={`text-xs ${isCurrentUser ? 'text-blue-400' : 'text-gray-400'}`}
                          >
                            $
                          </span>
                          {formatCurrency(investor.invested_amount)}
                        </p>
                      </div>
                      <div
                        className={`bg-gray-800/50 p-2 rounded ${isCurrentUser ? 'bg-blue-900/30' : ''}`}
                      >
                        <p className="text-xs text-gray-400 font-medium">
                          Final
                        </p>
                        <p
                          className={`text-sm font-semibold flex items-baseline ${isPositiveReturn ? 'text-green-400' : 'text-red-400'}`}
                        >
                          <span className="text-xs">$</span>
                          {formatCurrency(investor.final_balance)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </div>
  );
}
