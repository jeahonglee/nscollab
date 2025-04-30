'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DemodayResults } from '@/types/demoday';

interface ResultsSectionProps {
  results: DemodayResults;
  currentUserId: string | undefined;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function ResultsSection(props: ResultsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Demoday Results</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Results from this demoday session.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
