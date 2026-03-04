'use client';

import React from 'react';
import { KpiDashboardPageV2Content } from '@/components/kpi/KpiDashboardPageV2Content';

/** KPI Dashboard page. Uses createElement (no JSX) to avoid SWC parse error in this file. */
export function KpiDashboardPageV2() {
  return React.createElement(KpiDashboardPageV2Content, null);
}
