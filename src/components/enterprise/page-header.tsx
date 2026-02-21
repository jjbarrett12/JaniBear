'use client';

import { cn } from '@/lib/utils';

export function PageHeader({
  title,
  breadcrumb,
  badge,
  actions,
  description,
  className,
}: {
  title: React.ReactNode;
  breadcrumb?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        'flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4',
        className
      )}
    >
      <div className="min-w-0 flex-1 space-y-1">
        {breadcrumb && (
          <nav className="text-xs font-medium text-muted-foreground">
            {breadcrumb}
          </nav>
        )}
        <div className="flex flex-wrap items-center gap-2 gap-y-1">
          <h1 className="font-heading text-[28px] md:text-[32px] font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {badge && <span className="shrink-0">{badge}</span>}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">
          {actions}
        </div>
      )}
    </header>
  );
}
