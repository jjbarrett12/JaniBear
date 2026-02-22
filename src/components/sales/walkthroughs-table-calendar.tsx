'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LayoutGrid, List, FileText } from 'lucide-react';
import { formatDate } from '@/lib/utils';

type WalkthroughRow = {
  id: string;
  status: string;
  scheduled_at: string | null;
  opportunity_id: string | null;
  accountName: string;
};

export function WalkthroughsTableCalendar({ walkthroughs }: { walkthroughs: WalkthroughRow[] }) {
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant={viewMode === 'table' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('table')}
          className="gap-2"
        >
          <List className="h-4 w-4" />
          Table
        </Button>
        <Button
          variant={viewMode === 'calendar' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('calendar')}
          className="gap-2"
        >
          <LayoutGrid className="h-4 w-4" />
          Calendar
        </Button>
      </div>

      {viewMode === 'table' ? (
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {walkthroughs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No walkthroughs yet. Schedule one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                walkthroughs.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="text-muted-foreground">
                      {w.scheduled_at ? formatDate(w.scheduled_at) : 'Unscheduled'}
                    </TableCell>
                    <TableCell className="font-medium">{w.accountName}</TableCell>
                    <TableCell>
                      <Badge variant={w.status === 'completed' ? 'secondary' : 'outline'} className="capitalize">
                        {w.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/app/walkthroughs/${w.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                        <Link href={`/app/proposals/build?walkthrough=${w.id}`}>
                          <Button variant="outline" size="sm" className="gap-1">
                            <FileText className="h-3 w-3" />
                            Create Scope
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-md border border-border bg-muted/20 p-8 text-center text-muted-foreground">
          <p>Calendar view (TODO). Use Table view for now.</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => setViewMode('table')}>
            Switch to Table
          </Button>
        </div>
      )}
    </>
  );
}
