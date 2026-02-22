'use client';

import type { ReactNode } from 'react';
import { SlideOverDrawer } from '@/components/enterprise/slide-over-drawer';

export interface KpiDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function KpiDetailsDrawer({
  open,
  onClose,
  title,
  subtitle,
  children,
}: KpiDetailsDrawerProps) {
  return (
    <SlideOverDrawer
      open={open}
      onClose={onClose}
      title={title}
      width="max-w-lg"
      className="max-w-full sm:max-w-lg"
    >
      <div className="px-6 pb-6">
        {subtitle && <p className="text-sm text-muted-foreground -mt-1 mb-4">{subtitle}</p>}
        {children}
      </div>
    </SlideOverDrawer>
  );
}
