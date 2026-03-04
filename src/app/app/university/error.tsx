'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function UniversityError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('University error:', error);
  }, [error]);

  return (
    <div className="space-y-6 pb-8">
      <Card className="border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>University couldn&apos;t load</CardTitle>
          </CardHeader>
          <CardDescription>
            Something went wrong loading training content. You can try again or go back.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
            {error.message || 'An unknown error occurred'}
          </p>
          <div className="flex gap-2">
            <Button onClick={reset}>Try again</Button>
            <Button variant="outline" asChild>
              <a href="/app/university">Back to University</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
