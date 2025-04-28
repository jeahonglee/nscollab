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
const DEFAULT_WEEKS = 13;
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

export const ContributionGraph: React.FC<ContributionGraphProps> = ({
  data,
  title = "Contributions in the last 3 months",
  months = 3,
  colorScheme = DEFAULT_COLORS,
}) => {
  // Calculate number of weeks based on months (approximately 4.33 weeks per month)
  const weeksToShow = Math.ceil(months * 4.33);
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - (weeksToShow * DAYS_IN_WEEK) + 1); // Go back by the number of weeks
  // Adjust to the beginning of the week (Sunday)
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const contributionsMap = new Map<string, number>();
  data.forEach(item => {
    contributionsMap.set(item.date, item.count);
  });

  const weeks: Array<Array<{ date: string; count: number } | null>> = Array.from({ length: weeksToShow }, () => Array(DAYS_IN_WEEK).fill(null));
  const monthLabels: Array<{ label: string; columnIndex: number }> = [];

  let currentDate = new Date(startDate);
  let lastMonth = -1;

  for (let week = 0; week < weeksToShow; week++) {
    for (let day = 0; day < DAYS_IN_WEEK; day++) {
      const dateStr = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD

      // Only fill cells within the actual last year range relative to endDate
      if (currentDate <= endDate) {
        const count = contributionsMap.get(dateStr) || 0;
        // Place the day in the correct column based on its day of the week
        weeks[week][currentDate.getDay()] = { date: dateStr, count };

        // Track month changes for labels
        const currentMonth = currentDate.getMonth();
        if (currentMonth !== lastMonth) {
            // Only add a label for the first day of each month
            if (currentDate.getDate() === 1 || (week === 0 && day === 0)) {
                // Store month and exact column position
                monthLabels.push({ 
                  label: currentDate.toLocaleDateString('en-US', { month: 'short' }),
                  columnIndex: week
                });
            }
            lastMonth = currentMonth;
        }
      } else {
        // For future dates, add null to maintain grid structure but don't display
        weeks[week][currentDate.getDay()] = null;
      }

      // Move to the next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }


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
            {monthLabels
              // Group by month name and keep only the first occurrence of each month
              .reduce((unique, current) => {
                if (!unique.some(item => item.label === current.label)) {
                  unique.push(current);
                }
                return unique;
              }, [] as typeof monthLabels)
              // Sort chronologically (assuming the data comes in date order)
              .sort((a, b) => a.columnIndex - b.columnIndex)
              // Only use the relevant months (up to 3 for a 3-month view)
              .slice(-3)
              // Position labels exactly above their starting columns
              .map(({ label, columnIndex }) => (
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
