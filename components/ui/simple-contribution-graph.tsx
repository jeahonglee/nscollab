import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ContributionData {
  date: string; // YYYY-MM-DD
  count: number;
}

interface SimpleContributionGraphProps {
  data: ContributionData[];
  maxDays?: number; // Maximum number of days to generate (for performance)
  size?: 'sm' | 'md'; // Size variants
  colorScheme?: Record<number, string>; // Optional: customize colors
  className?: string; // Additional classes
  showTooltips?: boolean; // Whether to show tooltips
  rightAligned?: boolean; // Whether to align from the right (show most recent)
}

// Default color scheme (similar to GitHub)
const DEFAULT_COLORS: Record<number, string> = {
  0: 'bg-gray-100 dark:bg-gray-800', // No contributions
  1: 'bg-green-200 dark:bg-green-900', // 1-2 contributions
  2: 'bg-green-400 dark:bg-green-700', // 3-4 contributions
  3: 'bg-green-600 dark:bg-green-500', // 5-6 contributions
  4: 'bg-green-800 dark:bg-green-300', // 7+ contributions
};

// Function to determine color level based on count
const getColorLevel = (count: number): number => {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  if (count <= 6) return 3;
  return 4;
};

// Function to format date for display
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  // Adjust for timezone offset to prevent date shifts
  const userTimezoneOffset = date.getTimezoneOffset() * 60000;
  const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
  return adjustedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const SimpleContributionGraph: React.FC<SimpleContributionGraphProps> = ({
  data,
  maxDays = 90, // Generate up to 90 days of data (performance limit)
  size = 'md',
  colorScheme = DEFAULT_COLORS,
  className = '',
  showTooltips = true,
  rightAligned = true, // Default to right-aligned (show most recent)
}) => {
  // Always generate a reasonable amount of data, container will handle overflow
  const daysToGenerate = maxDays;
  
  // Get current date and calculate start date
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - daysToGenerate);
  
  // Create a map of counts by date
  const contributionsMap = new Map<string, number>();
  data.forEach(item => {
    contributionsMap.set(item.date, item.count);
  });
  
  // Create array for days within range
  const daysData: Array<{ date: string; count: number }> = [];
  
  // Fill days array with data
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const count = contributionsMap.get(dateStr) || 0;
    daysData.push({ date: dateStr, count });
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Always use all days - the container's overflow will handle limiting display
  // But if right-aligned, we should reverse the order to show most recent days first
  const displayDays = rightAligned ? [...daysData].reverse() : daysData;
  
  // Determine box size based on size prop
  const boxSize = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3';
  const gap = size === 'sm' ? 'gap-[2px]' : 'gap-[3px]';
  
  // Render the simple horizontal graph
  return (
    <TooltipProvider>
      <div className={`flex ${gap} items-center overflow-hidden ${className}`}>
        {displayDays.map(({ date, count }) => {
          const colorLevel = getColorLevel(count);
          const colorClass = colorScheme[colorLevel];
          
          const cell = (
            <div 
              className={`${boxSize} rounded-sm ${colorClass}`}
              data-date={date}
              data-count={count}
            />
          );
          
          return showTooltips ? (
            <Tooltip key={date}>
              <TooltipTrigger asChild>
                {cell}
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{count} contribution{count !== 1 ? 's' : ''} on {formatDate(date)}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div key={date}>{cell}</div>
          );
        })}
      </div>
    </TooltipProvider>
  );
};
