'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface ElevatedCardProps {
  children: ReactNode;
  className?: string;
  /** When true, shows subtle accent glow (selected, dragging, or alert). Uses theme primary. */
  accent?: boolean;
  as?: 'div' | 'section' | 'article';
}

/**
 * Reusable elevated card style for dashboard KPI tiles, charts, and widgets.
 * - Background: slightly lighter than page (theme tokens; fallback rgba(255,255,255,0.04))
 * - Border: 1px solid rgba(255,255,255,0.08)
 * - Radius: 16–18px
 * - Shadow stack for premium depth; hover lift; optional accent glow.
 */
export function ElevatedCard({ children, className, accent, as: Tag = 'div' }: ElevatedCardProps) {
  return (
    <Tag
      className={cn(
        'elevated-card',
        accent && 'elevated-card-accent',
        className
      )}
    >
      {children}
    </Tag>
  );
}
