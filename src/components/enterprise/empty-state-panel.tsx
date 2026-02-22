'use client';

import { cn } from '@/lib/utils';
import { EmptyState } from './empty-state';
import { SectionCard } from './section-card';

export interface EmptyStatePanelProps {
  /** Same as EmptyState */
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** Optional card title (section label above the empty state) */
  sectionTitle?: React.ReactNode;
  sectionDescription?: React.ReactNode;
  className?: string;
}

/**
 * Empty state inside a section card for secondary panels or dedicated empty views.
 */
export function EmptyStatePanel({
  icon,
  title,
  description,
  action,
  sectionTitle,
  sectionDescription,
  className,
}: EmptyStatePanelProps) {
  return (
    <SectionCard
      title={sectionTitle}
      description={sectionDescription}
      className={cn(className)}
    >
      <EmptyState
        icon={icon}
        title={title}
        description={description}
        action={action}
      />
    </SectionCard>
  );
}
