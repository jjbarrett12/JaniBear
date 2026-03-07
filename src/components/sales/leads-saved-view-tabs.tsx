'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { LeadSavedViewKey } from '@/lib/sales/types';
import { SALES_COPY } from '@/lib/sales-module-copy';

const VIEW_KEYS: LeadSavedViewKey[] = [
  'my_new_leads',
  'hot_leads',
  'needs_first_touch',
  'needs_follow_up',
  'ready_for_walkthrough',
  'unworked_imports',
  'high_value_targets',
  'referrals',
  'possible_duplicates',
];

export function LeadsSavedViewTabs({ currentView }: { currentView: LeadSavedViewKey }) {
  const pathname = usePathname();
  const base = pathname?.split('?')[0] ?? '/app/sales/leads';

  return (
    <nav className="flex flex-wrap gap-1 border-b border-border pb-3" aria-label="Saved views">
      {VIEW_KEYS.map((view) => (
        <Link
          key={view}
          href={`${base}?view=${view}`}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
            currentView === view
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          )}
        >
          {SALES_COPY.leads.savedViews[view]}
        </Link>
      ))}
    </nav>
  );
}
