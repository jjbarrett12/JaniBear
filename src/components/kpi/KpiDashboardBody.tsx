'use client';

import React from 'react';
import { KpiDashboardBodyContent } from '@/components/kpi/KpiDashboardBodyContent';

/** KPI dashboard body wrapper. No JSX in this file so Vercel SWC does not hit parse error. */
export function KpiDashboardBody() {
  return React.createElement(
    'div',
    { className: 'flex flex-col gap-6' },
    React.createElement(KpiDashboardBodyContent, null)
  );
}
