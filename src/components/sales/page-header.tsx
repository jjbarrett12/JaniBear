'use client';

import { ReactNode } from 'react';

export function PageHeader({
  title,
  description,
  strap,
  primaryCta,
  secondaryActions,
  filters,
}: {
  title: string;
  description?: string;
  /** GRIZZLY: mode label above title (e.g. "Target board") */
  strap?: string;
  primaryCta?: ReactNode;
  secondaryActions?: ReactNode;
  filters?: ReactNode;
}) {
  return (
    <div className="shrink-0 space-y-3 pb-4 border-b border-border">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          {strap != null && (
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">{strap}</p>
          )}
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl mt-0.5">{title}</h1>
          {description != null && (
            <p className="text-muted-foreground text-sm mt-0.5">{description}</p>
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
