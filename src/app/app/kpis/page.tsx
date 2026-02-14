'use client';

import { useState } from 'react';
import { KpiStrip } from '@/components/kpi/kpi-strip';
import {
  getMockSalesKpis,
  getMockOperationsKpis,
} from '@/lib/kpi-metrics-mock';
import { BarChart3, Briefcase, LayoutGrid } from 'lucide-react';

type Tab = 'sales' | 'operations' | 'overview';

export default function KpiDashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const salesKpis = getMockSalesKpis();
  const operationsKpis = getMockOperationsKpis();

  const tabs: { id: Tab; label: string; icon: typeof LayoutGrid }[] = [
    { id: 'sales', label: 'Sales', icon: BarChart3 },
    { id: 'operations', label: 'Operations', icon: Briefcase },
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
  ];

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">
          KPI Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sales and operations metrics at a glance.
        </p>
      </div>

      <div className="flex gap-2 border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'sales' && (
        <KpiStrip tiles={salesKpis} title="Sales KPIs" />
      )}

      {activeTab === 'operations' && (
        <KpiStrip tiles={operationsKpis} title="Operations KPIs" />
      )}

      {activeTab === 'overview' && (
        <div className="space-y-8">
          <KpiStrip tiles={salesKpis} title="Sales KPIs" />
          <KpiStrip tiles={operationsKpis} title="Operations KPIs" />
        </div>
      )}
    </div>
  );
}
