'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

export type MetricCardProps = {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  badge?: { label: string; variant: 'default' | 'success' | 'warning' | 'danger' };
  href?: string;
  className?: string;
  children?: React.ReactNode;
};

const badgeClass = {
  default: 'bg-muted text-muted-foreground',
  success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  warning: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  danger: 'bg-red-500/15 text-red-600 dark:text-red-400',
};

/**
 * Metric content only (no card wrapper). Used inside WidgetFrame which provides the card.
 * Single source of padding (p-4 sm:p-5) to avoid double card + cramped layout.
 */
function MetricCardContent({
  title,
  value,
  subtitle,
  badge,
  children,
  className,
}: MetricCardProps) {
  return (
    <div className={cn('p-4 sm:p-5', className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
        {title}
      </p>
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          {value}
        </span>
        {badge && (
          <span
            className={cn(
              'shrink-0 rounded-md px-2 py-0.5 text-xs font-medium',
              badgeClass[badge.variant]
            )}
          >
            {badge.label}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      )}
      {children}
    </div>
  );
}

export function MetricCard({
  title,
  value,
  subtitle,
  badge,
  href,
  className,
  children,
}: MetricCardProps) {
  const content = <MetricCardContent title={title} value={value} subtitle={subtitle} badge={badge} className={className}>{children}</MetricCardContent>;

  if (href) {
    return (
      <Link
        href={href}
        className="block min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-[17px]"
      >
        {content}
      </Link>
    );
  }
  return content;
}
