'use client';

import { ReactNode } from 'react';

export function PageHeader({
  title,
  description,
  primaryCta,
  secondaryActions,
  filters,
}: {
  title: string;
  description?: string;
  primaryCta?: ReactNode;
  secondaryActions?: ReactNode;
  filters?: ReactNode;
}) {
  return (
    <div className="shrink-0 space-y-4 pb-4 border-b border-border/60">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {description != null && (
            <p className="text-muted-foreground text-sm mt-1">{description}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {secondaryActions}
          {primaryCta}
        </div>
      </div>
      {filters != null && <div className="flex flex-wrap items-center gap-2">{filters}</div>}
    </div>
  );
}
