'use client';

import { useState } from 'react';
import {
  FinancialHealthHeader,
  defaultHeaderFilters,
  type FinancialHealthHeaderFilters,
} from '@/components/financial-health/financial-health-header';
import { OverviewTab } from '@/components/financial-health/overview-tab';
import { ProfitabilityTab } from '@/components/financial-health/profitability-tab';
import { ArTab } from '@/components/financial-health/ar-tab';
import { CostsTab } from '@/components/financial-health/costs-tab';
import { PricingLeakageTab } from '@/components/financial-health/pricing-leakage-tab';
import { ContractsAtRiskTab } from '@/components/financial-health/contracts-at-risk-tab';
import { SiteFinanceDrawer } from '@/components/financial-health/site-finance-drawer';
import type { SiteProfitabilityRow } from '@/lib/financial-health-mock';
import type { EmployeeLaborSummary } from '@/lib/employee-labor-summary';

type FinanceTabId = 'overview' | 'profitability' | 'ar' | 'costs' | 'pricing' | 'risk';

const TABS: { id: FinanceTabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'profitability', label: 'Profitability' },
  { id: 'ar', label: 'AR & Collections' },
  { id: 'costs', label: 'Costs' },
  { id: 'pricing', label: 'Pricing & Leakage' },
  { id: 'risk', label: 'Contracts at Risk' },
];

/** Operator (franchisee + owner/operator) Financial Health dashboard. No franchisor content. */
export function OperatorFinancialHealthDashboard({ laborSummary }: { laborSummary?: EmployeeLaborSummary | null }) {
  const [headerFilters, setHeaderFilters] = useState<FinancialHealthHeaderFilters>(defaultHeaderFilters);
  const [activeTab, setActiveTab] = useState<FinanceTabId>('overview');
  const [drawerSite, setDrawerSite] = useState<SiteProfitabilityRow | null>(null);

  const openDrawer = (row: SiteProfitabilityRow) => setDrawerSite(row);
  const closeDrawer = () => setDrawerSite(null);

  return (
    <div className="space-y-6 pb-8">
      <FinancialHealthHeader filters={headerFilters} onChange={setHeaderFilters} />

      <nav className="flex gap-1 border-b border-border" aria-label="Financial health sections">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="flex gap-0 min-h-0">
        <main className="flex-1 min-w-0">
          {activeTab === 'overview' && <OverviewTab onSiteRowClick={openDrawer} />}
          {activeTab === 'profitability' && <ProfitabilityTab onSiteRowClick={openDrawer} />}
          {activeTab === 'ar' && <ArTab />}
          {activeTab === 'costs' && <CostsTab />}
          {activeTab === 'pricing' && <PricingLeakageTab />}
          {activeTab === 'risk' && <ContractsAtRiskTab />}
        </main>
        {drawerSite && <SiteFinanceDrawer site={drawerSite} onClose={closeDrawer} />}
      </div>
    </div>
  );
}
