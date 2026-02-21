'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: number; up: boolean };
  icon?: React.ReactNode;
  href?: string;
  className?: string;
}

/**
 * Single KPI: metric + optional trend + micro subtext. No heavy gradients.
 */
export function KpiCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  href,
  className,
}: KpiCardProps) {
  const content = (
    <Card
      className={cn(
        'rounded-2xl border border-border bg-card shadow-sm transition-shadow duration-150 hover:shadow-md',
        href && 'cursor-pointer',
        className
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-3">
          {icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
              {icon}
            </div>
          )}
          {trend != null && (
            <div
              className={cn(
                'flex items-center gap-0.5 text-xs font-medium',
                trend.up ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
              )}
            >
              {trend.up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              <span>{trend.value > 0 && trend.up ? '+' : ''}{trend.value}%</span>
            </div>
          )}
        </div>
        <div className="mt-3 space-y-0.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {title}
          </p>
          <p className="font-heading text-2xl font-bold tracking-tight text-foreground">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <a href={href} className="block min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl">
        {content}
      </a>
    );
  }
  return content;
}
