'use client';

import * as React from 'react';

/** Root layout wrapper for KPI dashboard. Extracted to avoid SWC parse error on ( <div in main file. */
export function KpiDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[1360px] px-4 sm:px-6 space-y-8 pb-8">
      {children}
    </div>
  );
}
