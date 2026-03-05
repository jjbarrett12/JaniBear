'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { AppLink } from '@/components/app/app-link';
import { appRoutes } from '@/lib/routes';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="space-y-6 pb-8">
      <Card className="border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>Dashboard couldn&apos;t load</CardTitle>
          </div>
          <CardDescription>
            Something went wrong loading dashboard data. You can try again or go to another page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
            {error.message || 'An unknown error occurred'}
          </p>
          <div className="flex gap-2">
            <Button onClick={reset}>Try again</Button>
            <Button variant="outline" asChild>
              <AppLink href={appRoutes.dashboard()}>Refresh dashboard</AppLink>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
