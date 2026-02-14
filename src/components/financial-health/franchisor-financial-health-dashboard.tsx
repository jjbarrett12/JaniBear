'use client';

import { useState } from 'react';
import { FranchisorLeaderboard } from '@/components/financial-health/franchisor-leaderboard';
import { DashboardFilters, defaultFilters } from '@/components/financial-health/dashboard-filters';
import { getMockFranchiseeLeaderboard } from '@/lib/financial-health-mock';
import type { FinancialHealthFiltersState } from '@/components/financial-health/dashboard-filters';

/** Franchisor-only Financial Health: franchisee outcomes (recommended view). No operator KPIs/charts. */
export function FranchisorFinancialHealthDashboard() {
  const [filters, setFilters] = useState<FinancialHealthFiltersState>(defaultFilters);
  const franchisees = getMockFranchiseeLeaderboard();

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-heading font-bold text-foreground">
          Financial Health — Franchisee Outcomes
        </h1>
        <p className="text-sm text-muted-foreground">
          Self-reported outcome metrics and recommended standards. Outcome review only—not labor control.
        </p>
      </div>

      <DashboardFilters
        filters={filters}
        onChange={setFilters}
        showOrgSelector={true}
        orgs={franchisees.map((f) => ({ id: f.id, name: f.name }))}
      />

      <FranchisorLeaderboard franchisees={franchisees} />
    </div>
  );
}
