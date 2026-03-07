'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { GRIZZLY } from '@/lib/sales-module-copy';

const MODE_LINKS: { label: string; href: string }[] = [
  { label: GRIZZLY.modes.hunt, href: '/app/sales/leads' },
  { label: GRIZZLY.modes.book, href: '/app/sales/walkthroughs' },
  { label: GRIZZLY.modes.close, href: '/app/crm/pipeline' },
  { label: GRIZZLY.modes.manage, href: '/app/sales/accounts' },
];

export function GrizzlyModeStrip({ className }: { className?: string }) {
  return (
    <nav
      className={cn('flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground', className)}
      aria-label="Sales modes"
    >
      {MODE_LINKS.map(({ label, href }) => (
        <Link
          key={label}
          href={href}
          className="hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted/50"
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function GrizzlyPageStrap({ strap }: { strap: string }) {
  return (
    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">
      {strap}
    </span>
  );
}
