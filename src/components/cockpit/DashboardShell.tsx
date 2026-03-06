'use client';

import React from 'react';
import { cn } from '@/lib/utils';

const MAX_WIDTH = 'max-w-[1600px]';
const PADDING = 'px-4 sm:px-6 lg:px-8';

export interface DashboardShellProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardShell({ children, className }: DashboardShellProps) {
  return (
    <div className={cn('mx-auto w-full', MAX_WIDTH, PADDING, 'py-5 sm:py-6', 'space-y-5 sm:space-y-6', className)}>
      {children}
    </div>
  );
}
