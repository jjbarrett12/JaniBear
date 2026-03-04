'use client';

import { cn } from '@/lib/utils';
import { PageHeader } from './page-header';
import { ContentGrid } from './content-grid';

export interface PageShellProps {
  /** Custom header node (e.g. CommandCenterHeader). If set, title/description/actions are ignored. */
  header?: React.ReactNode;
  /** Title when using built-in header */
  title?: React.ReactNode;
  /** Optional breadcrumb */
  breadcrumb?: React.ReactNode;
  /** Optional badge next to title */
  badge?: React.ReactNode;
  /** Description below title */
  description?: React.ReactNode;
  /** Action buttons/links (right side on md+) */
  actions?: React.ReactNode;
  /** KPI strip above main content (2–4 metrics) */
  kpiStrip?: React.ReactNode;
  /** Primary content (left or full width) */
  children: React.ReactNode;
  /** Optional right-hand context panel (70/30 grid when set) */
  secondary?: React.ReactNode;
  className?: string;
}

/**
 * Enterprise page shell: header area, optional KPI strip, primary + optional secondary panels, consistent spacing.
 * Use either header (custom) or title+description+actions; kpiStrip and secondary are optional.
 */
export function PageShell({
  header,
  title,
  breadcrumb,
  badge,
  description,
  actions,
  kpiStrip,
  children,
  secondary,
  className,
}: PageShellProps) {
  const hasBuiltInHeader = !header && (title != null || description != null || actions != null);
  const mainContent = (
    <>
      {header ?? (hasBuiltInHeader && (
        <PageHeader
          title={title ?? ''}
          breadcrumb={breadcrumb}
          badge={badge}
          description={description}
          actions={actions}
        />
      ))}
      {kpiStrip && (
        <div className="min-w-0">
          {kpiStrip}
        </div>
      )}
      {secondary != null ? (
        <ContentGrid primary={<div className="min-w-0 space-y-6">{children}</div>} context={secondary} />
      ) : (
        <div className="min-w-0 space-y-6">
          {children}
        </div>
      )}
    </>
  );

  return (
    <div className={cn('space-y-8 pb-8 min-w-0', className)}>
      {mainContent}
    </div>
  );
}
