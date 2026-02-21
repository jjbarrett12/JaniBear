'use client';

import {
  getMockOverviewKpis,
  getMockFinanceAttentionAlerts,
  getMockMostProfitableSites,
  getMockWorstMarginLeaks,
  getMockRevenue12Months,
  getMockMarginTrend,
} from '@/lib/financial-health-mock';
import { OverviewKpiCardTile } from '@/components/financial-health/overview-kpi-card';
import { FinanceAttentionAlerts } from '@/components/financial-health/finance-attention-alerts';
import { RevenueMarginTrendChart } from '@/components/financial-health/revenue-margin-trend-chart';
import { SiteProfitabilityTable } from '@/components/financial-health/site-profitability-table';
import type { SiteProfitabilityRow } from '@/lib/financial-health-mock';

interface OverviewTabProps {
  onSiteRowClick?: (row: SiteProfitabilityRow) => void;
}

export function OverviewTab({ onSiteRowClick }: OverviewTabProps) {
  const kpis = getMockOverviewKpis();
  const alerts = getMockFinanceAttentionAlerts();
  const revenueMonths = getMockRevenue12Months();
  const marginMonths = getMockMarginTrend();
  const mostProfitable = getMockMostProfitableSites();
  const worstLeaks = getMockWorstMarginLeaks();

  return (
    <div className="space-y-6">
      <section aria-label="Executive finance snapshot">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Executive finance snapshot
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {kpis.map((card) => (
            <OverviewKpiCardTile key={card.id} card={card} />
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <RevenueMarginTrendChart revenueMonths={revenueMonths} marginMonths={marginMonths} />
        <div className="rounded-lg border border-border bg-card p-4">
          <FinanceAttentionAlerts alerts={alerts} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SiteProfitabilityTable
          rows={mostProfitable}
          title="Most profitable sites (top 10)"
          onRowClick={onSiteRowClick}
        />
        <SiteProfitabilityTable
          rows={worstLeaks}
          title="Worst margin leaks (top 10)"
          onRowClick={onSiteRowClick}
        />
      </div>
    </div>
  );
}
