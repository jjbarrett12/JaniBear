'use client';

import * as React from 'react';

/** Root layout: no horizontal/vertical scroll containers; content uses 12-col grid internally. */
export function KpiDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1360px] px-4 sm:px-6 overflow-x-hidden py-6 pb-8 space-y-8">
      {children}
    </div>
  );
}
