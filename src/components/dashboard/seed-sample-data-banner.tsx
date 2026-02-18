'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { seedSampleData } from '@/actions/seed-sample-data';
import { useRouter } from 'next/navigation';
import { Loader2, Database } from 'lucide-react';

export function SeedSampleDataBanner() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function handleSeed() {
    setLoading(true);
    setMessage(null);
    const result = await seedSampleData();
    setLoading(false);
    if (result.ok) {
      setMessage(result.message);
      router.refresh();
    } else {
      setMessage(`Error: ${result.error}`);
    }
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-amber-900 dark:text-amber-100">
        Your dashboard is showing sample numbers. Load sample data so Locations, Inspections, Issues, Crews, and Schedules have real data when you click through.
      </p>
      <div className="flex items-center gap-2">
        {message && (
          <span className="text-xs text-muted-foreground max-w-[200px] truncate" title={message}>
            {message}
          </span>
        )}
        <Button
          size="sm"
          variant="outline"
          className="border-amber-300 dark:border-amber-700"
          onClick={handleSeed}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Database className="h-4 w-4 mr-1.5" />
              Load sample data
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
