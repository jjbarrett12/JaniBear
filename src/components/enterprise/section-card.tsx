'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export interface SectionCardProps {
  /** Optional section title */
  title?: React.ReactNode;
  /** Optional description below title */
  description?: React.ReactNode;
  /** Optional icon or badge in header */
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Section wrapper: Card with optional title/description. Consistent padding (p-6), rounded-2xl, border.
 */
export function SectionCard({
  title,
  description,
  headerAction,
  children,
  className,
}: SectionCardProps) {
  const hasHeader = title != null || description != null || headerAction != null;
  return (
    <Card
      className={cn(
        'rounded-2xl border border-border bg-card shadow-sm',
        className
      )}
    >
      {hasHeader && (
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-4">
          <div className="space-y-1.5">
            {title != null && (
              <CardTitle className="text-lg font-semibold tracking-tight text-foreground">
                {title}
              </CardTitle>
            )}
            {description != null && (
              <CardDescription className="text-sm text-muted-foreground">
                {description}
              </CardDescription>
            )}
          </div>
          {headerAction != null && <div className="shrink-0">{headerAction}</div>}
        </CardHeader>
      )}
      <CardContent className={hasHeader ? 'p-6 pt-0' : 'p-6'}>
        {children}
      </CardContent>
    </Card>
  );
}
