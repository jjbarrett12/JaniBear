'use client';

import React from 'react';
import { KpiDashboardLayout } from '@/components/kpi/KpiDashboardLayout';
import { KpiDashboardPageV2ContentInner } from '@/components/kpi/KpiDashboardPageV2ContentInner';

/** KPI dashboard wrapper. No JSX in this file to avoid Vercel/SWC parse error (return + newline + JSX). */
export function KpiDashboardPageV2Content() {
  return React.createElement(
    KpiDashboardLayout,
    null,
    React.createElement(KpiDashboardPageV2ContentInner, null)
  );
}
