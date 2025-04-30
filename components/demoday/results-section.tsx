'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DemodayResults } from '@/types/demoday';

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

interface ResultsSectionProps {
  results: DemodayResults;
  currentUserId?: string;
}

export default function ResultsSection({
  results,
  currentUserId,
}: ResultsSectionProps) {
  const [activeTab, setActiveTab] = useState<string>('projects');

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

  // Get the appropriate badge for project rank
  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-amber-500">1st Place</Badge>;
    if (rank === 2) return <Badge className="bg-slate-400">2nd Place</Badge>;
    if (rank === 3) return <Badge className="bg-amber-800">3rd Place</Badge>;
    if (rank <= 5) return <Badge className="bg-emerald-600">Top 5</Badge>;
    return <Badge className="bg-muted">#{rank}</Badge>;
  };

  // Get multiplier text based on rank
  const getMultiplierText = (rank: number): string => {
    const multipliers = [20, 10, 5, 3, 2];
    if (rank <= 5) return `${multipliers[rank - 1]}x`;
    return '';
  };

  return (
    <div className="space-y-6">
      <div className="bg-muted p-4 rounded-lg text-center mb-6">
        <h2 className="text-xl font-bold mb-2">Demoday Results</h2>
        <p className="text-muted-foreground">
          These are the final results from the funding phase. The top 5 projects
          earned multipliers on investments.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="investors">Investors</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="mt-4">
          <div className="grid grid-cols-1 gap-4">
            {results.pitch_rankings.map((project) => (
              <Card
                key={project.pitch_id}
                className={
                  project.rank <= 3 ? 'border-2 border-amber-500/50' : ''
                }
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={project.pitcher_avatar || ''}
                          alt={project.pitcher_name || 'User'}
                        />
                        <AvatarFallback>
                          {getInitials(project.pitcher_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">
                          {project.idea_title}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          by{' '}
                          {project.pitcher_name ||
                            project.pitcher_username ||
                            'Anonymous'}
                        </CardDescription>
                      </div>
                    </div>
                    {getRankBadge(project.rank)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Total Funding
                      </p>
                      <p className="font-semibold">
                        {formatCurrency(project.total_funding)}
                      </p>
                    </div>
                    {project.rank <= 5 && (
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Investor Return
                        </p>
                        <p className="font-semibold text-green-600">
                          {getMultiplierText(project.rank)}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="investors" className="mt-4">
          <div className="grid grid-cols-1 gap-4">
            {results.investor_rankings.map((investor) => (
              <Card
                key={investor.investor_id}
                className={
                  investor.investor_id === currentUserId
                    ? 'border-2 border-blue-500/50'
                    : investor.rank <= 3
                      ? 'border-2 border-amber-500/50'
                      : ''
                }
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={investor.investor_avatar || ''}
                          alt={investor.investor_name || 'User'}
                        />
                        <AvatarFallback>
                          {getInitials(investor.investor_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">
                          {investor.investor_name ||
                            investor.investor_username ||
                            'Anonymous'}
                          {investor.investor_id === currentUserId && (
                            <span className="ml-2 text-sm text-blue-500">
                              (You)
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Rank #{investor.rank}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge
                      className={
                        investor.returns > 0 ? 'bg-green-600' : 'bg-slate-500'
                      }
                    >
                      {investor.returns > 0 ? '+' : ''}
                      {formatCurrency(investor.returns)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Initial</p>
                      <p className="font-semibold">
                        {formatCurrency(investor.initial_balance)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Invested</p>
                      <p className="font-semibold">
                        {formatCurrency(investor.invested_amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Final</p>
                      <p
                        className={`font-semibold ${investor.final_balance > investor.initial_balance ? 'text-green-600' : ''}`}
                      >
                        {formatCurrency(investor.final_balance)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
