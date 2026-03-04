'use client';

import { Lock } from 'lucide-react';
import { LAYOUT_LOCKED_BANNER } from './layout-selector-copy';

export function LayoutLockedBanner() {
  return (
    <div
      role="status"
      className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
    >
      <Lock className="h-4 w-4 shrink-0" aria-hidden />
      <span>{LAYOUT_LOCKED_BANNER}</span>
    </div>
  );
}
