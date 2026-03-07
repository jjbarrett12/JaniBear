'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { AppEmptyState } from '@/components/app/app-empty-state';
import { LAUNCH_HANDOFF_COPY } from '@/lib/launch-handoff-copy';
import { Rocket } from 'lucide-react';

export type LaunchIntakeItem = {
  id: string;
  accountId: string;
  accountName: string;
  status: string;
  readyAt: string | null;
  createdAt: string;
  missingItems: string[];
};

export function LaunchIntakeList({
  items,
  highlightId,
}: {
  items: LaunchIntakeItem[];
  highlightId?: string;
}) {
  const highlightRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [highlightId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Incoming launches</CardTitle>
        <p className="text-sm text-muted-foreground">
          Status, start date, priority. Accept Intake or Request Changes. Assign ops owner in detail.
        </p>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <AppEmptyState
            icon={<Rocket className="h-6 w-6" />}
            title="No launches in queue"
            description={LAUNCH_HANDOFF_COPY.intakeEmpty}
          />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((p) => (
              <li
                key={p.id}
                ref={p.id === highlightId ? highlightRef : undefined}
                className={`py-3 flex flex-wrap items-center justify-between gap-2 ${p.id === highlightId ? 'bg-primary/10 ring-1 ring-primary/30 rounded-md px-3 -mx-3' : ''}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/app/ops/launch-intake/${p.id}`} className="font-medium text-primary hover:underline">
                    {p.accountName}
                  </Link>
                  {p.missingItems.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      Missing: {p.missingItems.join(', ')}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{p.readyAt ? formatDate(p.readyAt) : formatDate(p.createdAt)}</span>
                  <Badge variant="secondary" className="capitalize">{p.status.replace(/_/g, ' ')}</Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
