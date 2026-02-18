'use client';

import { useState } from 'react';
import { HealthKpiStrip } from '@/components/financial-health/health-kpi-strip';
import { DashboardFilters, defaultFilters } from '@/components/financial-health/dashboard-filters';
import { RevenueGrowthCharts } from '@/components/financial-health/revenue-growth-charts';
import { ProfitabilityCharts } from '@/components/financial-health/profitability-charts';
import { LaborOpsCharts } from '@/components/financial-health/labor-ops-charts';
import { CashCollectionsCharts } from '@/components/financial-health/cash-collections-charts';
import { BearHealthScore } from '@/components/financial-health/bear-health-score';
import { AlertsInsightsPanel } from '@/components/financial-health/alerts-insights-panel';
import {
  getMockKpiStrip,
  getMockRevenue12Months,
  getMockTop10Clients,
  getMockRevenueByVertical,
  getMockMarginTrend,
  getMockWaterfall,
  getMockContractProfitability,
  getMockLaborTrend,
  getMockOvertimeWeekly,
  getMockAccountBubbles,
  getMockArAging,
  getMockCashForecast,
  getMockInsights,
  getMockBearScore,
  getMockTopDrivers,
} from '@/lib/financial-health-mock';
import type { FinancialHealthFiltersState } from '@/components/financial-health/dashboard-filters';
import type { EmployeeLaborSummary } from '@/lib/employee-labor-summary';

const MOCK_REVENUE = 42800;

/** Operator (franchisee + owner/operator) Financial Health dashboard. No franchisor content. */
export function OperatorFinancialHealthDashboard({ laborSummary }: { laborSummary?: EmployeeLaborSummary | null }) {
  const [filters, setFilters] = useState<FinancialHealthFiltersState>(defaultFilters);

  const monthlyLabor = laborSummary?.monthlyLaborDollars;
  const laborPct = monthlyLabor != null && monthlyLabor > 0 ? (monthlyLabor / MOCK_REVENUE) * 100 : undefined;

  const kpiStrip = getMockKpiStrip(laborPct);
  const revenue12 = getMockRevenue12Months();
  const topClients = getMockTop10Clients();
  const byVertical = getMockRevenueByVertical();
  const marginTrend = getMockMarginTrend();
  const waterfall = getMockWaterfall(monthlyLabor);
  const contractProfit = getMockContractProfitability();
  const laborTrend = getMockLaborTrend(laborPct);
  const overtime = getMockOvertimeWeekly();
  const bubbles = getMockAccountBubbles();
  const arAging = getMockArAging();
  const cashForecast = getMockCashForecast();
  const insights = getMockInsights();
  const bearScore = getMockBearScore();
  const topDrivers = getMockTopDrivers();
  const bidAccuracy = 1.02;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-heading font-bold text-foreground">
          Financial Health
        </h1>
        <p className="text-sm text-muted-foreground">
          Are we profitable, stable, and pricing correctly—or are we bleeding? Answer in 10 seconds.
        </p>
        {laborSummary && laborSummary.activeCount > 0 && (
          <p className="text-xs text-muted-foreground">
            Payroll from {laborSummary.activeCount} active employee{laborSummary.activeCount !== 1 ? 's' : ''} (hourly + salary) is included in Labor cost and Labor % of Revenue.
          </p>
        )}
      </div>

      <DashboardFilters
        filters={filters}
        onChange={setFilters}
        showOrgSelector={false}
      />

      <HealthKpiStrip tiles={kpiStrip} />

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8 min-w-0">
          <RevenueGrowthCharts
            revenue12Months={revenue12}
            topClients={topClients}
            byVertical={byVertical}
          />
          <ProfitabilityCharts
            marginTrend={marginTrend}
            waterfall={waterfall}
            contractProfitability={contractProfit}
          />
          <LaborOpsCharts
            laborTrend={laborTrend}
            overtimeWeekly={overtime}
            accountBubbles={bubbles}
            bidAccuracy={bidAccuracy}
          />
          <CashCollectionsCharts arAging={arAging} cashForecast={cashForecast} />
        </div>
        <div className="space-y-6">
          <BearHealthScore score={bearScore} topDrivers={topDrivers} />
          <AlertsInsightsPanel insights={insights} />
        </div>
      </div>
    </div>
  );
}
