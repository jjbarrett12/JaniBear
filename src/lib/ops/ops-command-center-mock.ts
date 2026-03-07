/**
 * Mock/demo data for Ops Command Center when real APIs are not wired.
 * Replace with getOpsCommandCenterData(orgId) that aggregates from:
 * - getCommandCenterData (dashboard): revenue, accountHealth, risk, crew
 * - getCommandCenterData (ops): riskAccounts, coverageGaps, recommendedActions
 * - service_deployments: open count, live list, upcoming go-lives
 * - crews / schedules: crews scheduled today, capacity
 */

import type {
  OpsCommandCenterData,
  OpsCommandCenterKPIs,
  UrgentActionItem,
  TerritoryCoverageItem,
  LiveDeploymentItem,
  AccountHealthWatchlistItem,
  CrewCapacityItem,
  UpcomingGoLiveItem,
} from './ops-command-center-types';

const MOCK_KPIS: OpsCommandCenterKPIs = {
  activeAccounts: 42,
  crewsScheduledToday: 18,
  accountsAtRisk: 5,
  openDeployments: 7,
  slaBreaches: 2,
  revenueScheduledToday: 12450,
};

const MOCK_ACTIONS: UrgentActionItem[] = [
  { id: '1', type: 'coverage_gap', title: 'Coverage needed tonight', subtitle: 'Downtown Tower · 6pm shift', href: '/app/ops/command-center?tab=coverage', priority: 1 },
  { id: '2', type: 'risk_account', title: 'Acme Corp below threshold', subtitle: 'Risk score 42 · 2 missed inspections', href: '/app/ops/risk/account-1', priority: 2 },
  { id: '3', type: 'sla_breach', title: 'Inspection overdue', subtitle: 'North Campus · Due yesterday', href: '/app/ops/issues-sla', priority: 3 },
];

const MOCK_TERRITORY: TerritoryCoverageItem[] = [
  { id: 't1', territoryName: 'North', accountCount: 12, scheduledCount: 12, coveragePct: 100, status: 'ok' },
  { id: 't2', territoryName: 'South', accountCount: 8, scheduledCount: 7, coveragePct: 88, status: 'partial' },
  { id: 't3', territoryName: 'Central', accountCount: 15, scheduledCount: 14, coveragePct: 93, status: 'partial' },
];

const MOCK_LIVE_DEPLOYMENTS: LiveDeploymentItem[] = [
  { id: 'd1', accountName: 'Acme Corp', deploymentType: 'New account', stage: 'Crew Assignment', requestedAt: '2025-03-01', href: '/app/ops/service-deployments' },
  { id: 'd2', accountName: 'Beta Industries', deploymentType: 'Scope change', stage: 'Go-Live Preparation', requestedAt: '2025-02-28', href: '/app/ops/service-deployments' },
];

const MOCK_HEALTH: AccountHealthWatchlistItem[] = [
  { id: 'a1', accountName: 'Acme Corp', riskScore: 42, riskLevel: 'critical', topReason: '2 missed inspections', href: '/app/ops/risk/a1' },
  { id: 'a2', accountName: 'Beta Industries', riskScore: 58, riskLevel: 'high', topReason: 'Declining score', href: '/app/ops/risk/a2' },
];

const MOCK_CREW: CrewCapacityItem[] = [
  { id: 'c1', crewName: 'Crew A', scheduledToday: 4, capacity: 5, utilizationPct: 80, status: 'ok' },
  { id: 'c2', crewName: 'Crew B', scheduledToday: 5, capacity: 5, utilizationPct: 100, status: 'high' },
  { id: 'c3', crewName: 'Crew C', scheduledToday: 3, capacity: 5, utilizationPct: 60, status: 'ok' },
];

const MOCK_GO_LIVES: UpcomingGoLiveItem[] = [
  { id: 'g1', accountName: 'Gamma LLC', goLiveDate: '2025-03-10', deploymentType: 'New account', href: '/app/ops/service-deployments' },
  { id: 'g2', accountName: 'Delta Services', goLiveDate: '2025-03-12', deploymentType: 'Service restart', href: '/app/ops/service-deployments' },
];

export function getOpsCommandCenterMock(userName: string, orgName: string | null): OpsCommandCenterData {
  return {
    kpis: MOCK_KPIS,
    urgentActions: MOCK_ACTIONS,
    territoryCoverage: MOCK_TERRITORY,
    liveDeployments: MOCK_LIVE_DEPLOYMENTS,
    accountHealthWatchlist: MOCK_HEALTH,
    crewCapacity: MOCK_CREW,
    upcomingGoLives: MOCK_GO_LIVES,
    userName,
    orgName,
  };
}
