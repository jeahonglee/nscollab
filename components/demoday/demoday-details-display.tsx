'use client';

import React from 'react';
import { format, parseISO } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InfoIcon, Calendar, MapPin, PenSquare } from 'lucide-react';
import { DemodayEntry } from '@/types/demoday';

interface DemodayDetailsDisplayProps {
  demoday: DemodayEntry;
  isHost: boolean;
  onEditDetails: () => void;
}

export default function DemodayDetailsDisplay({
  demoday,
  isHost,
  onEditDetails,
}: DemodayDetailsDisplayProps) {
  // Check if details exist
  const hasDetails =
    demoday.details &&
    (demoday.details.when ||
      demoday.details.where ||
      demoday.details.what ||
      demoday.details.luma_url);

  if (!hasDetails && !isHost) {
    return null; // Don't show anything if there are no details and user is not host
  }

  const formatEventDate = (dateString: string): string => {
    try {
      return format(parseISO(dateString), 'MMMM yyyy');
    } catch {
      return 'Invalid Date';
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Demoday {formatEventDate(demoday.event_date)}</CardTitle>
            <CardDescription>
              {demoday.status === 'upcoming'
                ? 'Upcoming event'
                : demoday.status === 'pitching'
                  ? 'Currently in progress'
                  : 'Completed event'}
            </CardDescription>
          </div>
          {isHost && (
            <Button variant="outline" size="sm" onClick={onEditDetails}>
              <PenSquare className="h-4 w-4 mr-2" />
              {hasDetails ? 'Edit Details' : 'Set Details'}
            </Button>
          )}
        </div>
      </CardHeader>
      {hasDetails && (
        <CardContent>
          <div className="space-y-2">
            {demoday.details.when && (
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{demoday.details.when}</span>
              </div>
            )}
            {demoday.details.where && (
              <div className="flex items-center text-sm">
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{demoday.details.where}</span>
              </div>
            )}
            {demoday.details.what && (
              <div className="flex items-start text-sm">
                <InfoIcon className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                <span>{demoday.details.what}</span>
              </div>
            )}
            {demoday.details.luma_url && (
              <div className="mt-3">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    if (demoday.details.luma_url) {
                      window.open(demoday.details.luma_url, '_blank');
                    }
                  }}
                >
                  Register on Luma
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
