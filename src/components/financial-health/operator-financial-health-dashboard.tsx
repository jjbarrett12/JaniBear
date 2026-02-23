'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  FinancialHealthHeader,
  defaultHeaderFilters,
  type FinancialHealthHeaderFilters,
} from '@/components/financial-health/financial-health-header';
import { ConnectQuickBooksOnboarding } from '@/components/financial-health/connect-quickbooks-onboarding';
import { OverviewTab } from '@/components/financial-health/overview-tab';
import { ProfitabilityTab } from '@/components/financial-health/profitability-tab';
import { ArTab } from '@/components/financial-health/ar-tab';
import { CostsTab } from '@/components/financial-health/costs-tab';
import { PricingLeakageTab } from '@/components/financial-health/pricing-leakage-tab';
import { ContractsAtRiskTab } from '@/components/financial-health/contracts-at-risk-tab';
import { ExpensesTab } from '@/components/financial-health/expenses-tab';
import { SiteFinanceDrawer } from '@/components/financial-health/site-finance-drawer';
import type { SiteProfitabilityRow } from '@/lib/financial-health-mock';
import type { EmployeeLaborSummary } from '@/lib/employee-labor-summary';
import type { ARSnapshotExtended } from '@/lib/command-center-data';

type FinanceTabId = 'overview' | 'profitability' | 'ar' | 'costs' | 'pricing' | 'risk' | 'expenses';

const TABS: { id: FinanceTabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'profitability', label: 'Profitability' },
  { id: 'ar', label: 'AR & Collections' },
  { id: 'costs', label: 'Costs' },
  { id: 'pricing', label: 'Pricing & Leakage' },
  { id: 'risk', label: 'Contracts at Risk' },
  { id: 'expenses', label: 'Expenses' },
];

/** Operator (franchisee + owner/operator) Financial Health dashboard. No franchisor content. */
export function OperatorFinancialHealthDashboard({
  orgId,
  laborSummary,
  arSnapshot,
}: {
  orgId: string;
  laborSummary?: EmployeeLaborSummary | null;
  /** Real AR from invoices; used by Overview and AR tab so they show correct figures. */
  arSnapshot?: ARSnapshotExtended | null;
}) {
  const [headerFilters, setHeaderFilters] = useState<FinancialHealthHeaderFilters>(defaultHeaderFilters);
  const [activeTab, setActiveTab] = useState<FinanceTabId>('overview');
  const [drawerSite, setDrawerSite] = useState<SiteProfitabilityRow | null>(null);
  const [quickbooksConnected, setQuickbooksConnected] = useState<boolean | null>(null);
  const [isConnectingQB, setIsConnectingQB] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/integrations/quickbooks/status');
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setQuickbooksConnected(data.connected === true);
        } else {
          setQuickbooksConnected(false);
        }
      } catch {
        if (!cancelled) setQuickbooksConnected(false);
      }
    })();
    return () => { cancelled = true; };
  }, [searchParams.get('qb')]); // refetch when returning from OAuth (qb=connected)

  const openDrawer = (row: SiteProfitabilityRow) => setDrawerSite(row);
  const closeDrawer = () => setDrawerSite(null);

  const handleConnectQuickBooks = () => {
    setIsConnectingQB(true);
    window.location.href = '/api/integrations/quickbooks/connect';
  };

  const qbParam = searchParams.get('qb');
  const qbMessage = searchParams.get('message');

  return (
    <div className="space-y-6 pb-8">
      {qbParam === 'connected' && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-800 dark:text-green-200">
          QuickBooks is connected. We’ll use your accounting data to keep Financial Health in sync.
        </div>
      )}
      {qbParam === 'error' && qbMessage && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-800 dark:text-red-200">
          Connection failed: {qbMessage}
        </div>
      )}
      <FinancialHealthHeader
        filters={headerFilters}
        onChange={setHeaderFilters}
        quickbooksConnected={quickbooksConnected ?? false}
      />
      {quickbooksConnected === false && (
        <ConnectQuickBooksOnboarding onConnect={handleConnectQuickBooks} isConnecting={isConnectingQB} />
      )}

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
          {activeTab === 'overview' && <OverviewTab onSiteRowClick={openDrawer} arSnapshot={arSnapshot} />}
          {activeTab === 'profitability' && <ProfitabilityTab onSiteRowClick={openDrawer} />}
          {activeTab === 'ar' && <ArTab arSnapshot={arSnapshot} />}
          {activeTab === 'costs' && <CostsTab />}
          {activeTab === 'pricing' && <PricingLeakageTab />}
          {activeTab === 'risk' && <ContractsAtRiskTab />}
          {activeTab === 'expenses' && (
            <ExpensesTab orgId={orgId} laborSummary={laborSummary} />
          )}
        </main>
        {drawerSite && <SiteFinanceDrawer site={drawerSite} onClose={closeDrawer} />}
      </div>
    </div>
  );
}
