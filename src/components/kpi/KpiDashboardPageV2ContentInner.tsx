'use client';

import React from 'react';
import { KpiDashboardBody } from '@/components/kpi/KpiDashboardBody';

/** Thin wrapper with no JSX so Vercel SWC does not hit parse error on this file. */
export function KpiDashboardPageV2ContentInner() {
  return React.createElement(KpiDashboardBody, null);
}
