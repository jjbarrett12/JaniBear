'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type { SalesActionItem } from '@/types/sales';
import { Bell } from 'lucide-react';

type SortKey = 'revenue' | 'urgency' | 'stage';

export function SalesActionQueue(props: { items: SalesActionItem[]; sortable?: boolean }) {
  const { items, sortable = true } = props;
  const [sortBy, setSortBy] = useState<SortKey>('urgency');
  const [asc, setAsc] = useState(false);

  const u = { high: 3, medium: 2, low: 1 };
  const sorted = [...items].sort((a, b) => {
    if (sortBy === 'urgency') {
      const diff = (u[b.urgency] ?? 0) - (u[a.urgency] ?? 0);
      return asc ? -diff : diff;
    }
    if (sortBy === 'revenue') {
      const diff = (b.revenueImpact ?? 0) - (a.revenueImpact ?? 0);
      return asc ? -diff : diff;
    }
    if (sortBy === 'stage') {
      const diff = (a.stage ?? '').localeCompare(b.stage ?? '');
      return asc ? -diff : diff;
    }
    return 0;
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Needs attention
        </CardTitle>
        <p className="text-xs text-muted-foreground">Follow-ups due, proposals not viewed, stalled deals.</p>
        {sortable && items.length > 1 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {(['urgency', 'revenue', 'stage'] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => (sortBy === key ? setAsc((a) => !a) : (setSortBy(key), setAsc(false)))}
                className={`text-xs px-2 py-1 rounded border ${sortBy === key ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}
              >
                {key === 'revenue' ? 'Revenue impact' : key === 'urgency' ? 'Urgency' : 'Stage'}
                {sortBy === key && (asc ? ' ↑' : ' ↓')}
              </button>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border max-h-[380px] overflow-y-auto">
          {sorted.slice(0, 20).map((item) => (
            <li key={item.id}>
              <Link href={item.href ?? '#'} className="block px-4 py-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.subtitle}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5">
                    {item.revenueImpact != null && <span className="text-xs font-medium tabular-nums">{formatCurrency(item.revenueImpact)}</span>}
                    <span className={`h-2 w-2 rounded-full ${item.urgency === 'high' ? 'bg-health-red' : item.urgency === 'medium' ? 'bg-amber-500' : 'bg-health-green'}`} title={item.urgency} />
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        {items.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">Nothing needs attention.</p>}
      </CardContent>
    </Card>
  );
}
