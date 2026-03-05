'use client';

import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  rightAction?: ReactNode;
}

export function SectionHeader({ title, rightAction }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 mb-4">
      <h2 className="text-base font-semibold text-white tracking-tight">
        {title}
      </h2>
      {rightAction != null ? (
        <div className="shrink-0">{rightAction}</div>
      ) : null}
    </div>
  );
}
