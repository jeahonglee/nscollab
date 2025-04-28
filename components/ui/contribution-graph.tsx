import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ContributionData {
  date: string; // YYYY-MM-DD
  count: number;
}

interface ContributionGraphProps {
  data: ContributionData[];
  title?: string;
  months?: number; // Number of months to display
  colorScheme?: Record<number, string>; // Optional: customize colors
}

// Default to 13 weeks (approximately 3 months)
// Removed unused DEFAULT_WEEKS13;
const DAYS_IN_WEEK = 7;

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

// Helper to check if two dates are in the same week
const isDateInSameWeek = (date1: Date, date2: Date): boolean => {
  // Get the start of the week (Sunday) for both dates
  const startOfWeek1 = new Date(date1);
  startOfWeek1.setDate(date1.getDate() - date1.getDay());
  startOfWeek1.setHours(0, 0, 0, 0);
  
  const startOfWeek2 = new Date(date2);
  startOfWeek2.setDate(date2.getDate() - date2.getDay());
  startOfWeek2.setHours(0, 0, 0, 0);
  
  // Compare the starting dates of the weeks
  return startOfWeek1.getTime() === startOfWeek2.getTime();
};

export const ContributionGraph: React.FC<ContributionGraphProps> = ({
  data,
  title = "Contributions in the last 3 months",
  months = 3,
  colorScheme = DEFAULT_COLORS,
}) => {
  // Calculate number of weeks based on months (approximately 4.33 weeks per month)
  const weeksToShow = Math.ceil(months * 4.33);
  
  // Get current date - making sure to use the actual current date (April 29, 2025)
  const today = new Date();
  
  // Calculate the end of the current week (Saturday)
  const endOfWeek = new Date(today);
  const daysToEndOfWeek = 6 - today.getDay(); // Days until Saturday
  endOfWeek.setDate(today.getDate() + daysToEndOfWeek);
  
  // Set to end of day to ensure we include all of today's activity
  const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
  
  // Get start date by going back the required number of weeks from the end of current week
  const startDate = new Date(endOfWeek);
  startDate.setDate(endOfWeek.getDate() - (weeksToShow * DAYS_IN_WEEK) + 1);
  
  // Adjust to start at the beginning of the week (Sunday)
  startDate.setDate(startDate.getDate() - startDate.getDay());
  
  // Create a map of counts by date
  const contributionsMap = new Map<string, number>();
  data.forEach(item => {
    contributionsMap.set(item.date, item.count);
  });

  // Create weeks array for the grid
  const weeks: Array<Array<{ date: string; count: number } | null>> = [];
  const monthLabels: Array<{ label: string; columnIndex: number }> = [];

  const currentDate = new Date(startDate);
  let lastMonth = -1;
  
  // Fill in the grid with dates and contribution data
  for (let week = 0; week < weeksToShow; week++) {
    const weekData: Array<{ date: string; count: number } | null> = Array(DAYS_IN_WEEK).fill(null);
    weeks.push(weekData);
    
    for (let day = 0; day < DAYS_IN_WEEK; day++) {
      const dateStr = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Track month changes for labels
      const currentMonth = currentDate.getMonth();
      if (currentMonth !== lastMonth) {
        // Add month label for the first occurrence
        if (currentDate.getDate() <= 7) {
          monthLabels.push({ 
            label: currentDate.toLocaleDateString('en-US', { month: 'short' }),
            columnIndex: week
          });
        }
        lastMonth = currentMonth;
      }
      
      // Always include cells for the current week, marking future dates as empty
      const isFutureDate = currentDate > endDate;
      const isCurrentWeek = isDateInSameWeek(currentDate, today);
      
      // Add the cell data - either with contribution count or empty for future dates
      if (!isFutureDate) {
        // Regular date with actual data
        const count = contributionsMap.get(dateStr) || 0;
        weekData[day] = { date: dateStr, count };
      } else if (isCurrentWeek) {
        // Future date but in current week - show as empty tile
        weekData[day] = { date: dateStr, count: 0 };
      }
      
      // Move to the next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }
  
  // Process month labels to avoid overlapping
  // Get unique months by finding the earliest occurrence of each month
  const uniqueMonthLabels = monthLabels
    .reduce((unique, current) => {
      if (!unique.some(item => item.label === current.label)) {
        unique.push(current);
      }
      return unique;
    }, [] as typeof monthLabels)
    .sort((a, b) => a.columnIndex - b.columnIndex);

  return (
    <TooltipProvider>
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-x-auto">
        <div className="flex flex-col space-y-1.5 p-6 pb-0">
          <h3 className="text-lg font-semibold leading-none tracking-tight">{title}</h3>
        </div>
        <div className="p-6 pt-3">
          <div className="flex flex-col">
            {/* Month Labels */}
            <div className="flex mb-1 relative" style={{ marginLeft: '24px', height: '16px' }}>
              {/* Get unique months and their positions */}
              {uniqueMonthLabels.map(({ label, columnIndex }) => (
                <div
                  key={label}
                  className="text-xs text-gray-500 dark:text-gray-400 absolute"
                  style={{ left: `${columnIndex * 14}px` }}
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="flex">
              {/* Day Labels */}
              <div className="flex flex-col justify-between mr-1 text-xs text-gray-500 dark:text-gray-400" style={{ height: `${DAYS_IN_WEEK * (12 + 2) - 2}px`}}>
                <span></span> {/* Spacer */}
                <span>Mon</span>
                <span></span> {/* Spacer */}
                <span>Wed</span>
                <span></span> {/* Spacer */}
                <span>Fri</span>
                <span></span> {/* Spacer */}
              </div>

              {/* Grid */}
              <div className="grid grid-flow-col gap-0.5" style={{ gridTemplateRows: `repeat(${DAYS_IN_WEEK}, 12px)`, gridAutoColumns: '12px' }}>
                {weeks.flat().map((dayData, index) => {
                   if (!dayData) {
                       return <div key={`empty-${index}`} className="w-[12px] h-[12px]"></div>;
                   }
                  const { date, count } = dayData;
                  const colorLevel = getColorLevel(count);
                  const colorClass = colorScheme[colorLevel];

                  return (
                    <Tooltip key={date}>
                      <TooltipTrigger asChild>
                        <div
                          className={`w-[12px] h-[12px] rounded-sm ${colorClass}`}
                          data-date={date}
                          data-count={count}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm">{count} contribution{count !== 1 ? 's' : ''} on {formatDate(date)}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          </div>

           {/* Legend */}
           <div className="flex items-center justify-end mt-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="mr-1">Less</span>
            <div className="flex space-x-1 mx-1">
              {Object.entries(colorScheme).map(([level, colorClass]) => (
                <div key={level} className={`w-3 h-3 rounded-sm ${colorClass}`}></div>
              ))}
            </div>
            <span className="ml-1">More</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};
