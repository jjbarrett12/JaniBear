/**
 * Types for Ops Command Center page: KPIs, action rail, and panel data.
 * Designed for future integration with service deployments, account health, crew, inspections, schedules.
 */

export interface OpsCommandCenterKPIs {
  activeAccounts: number;
  crewsScheduledToday: number;
  accountsAtRisk: number;
  openDeployments: number;
  slaBreaches: number;
  revenueScheduledToday: number;
}

export interface UrgentActionItem {
  id: string;
  type: 'coverage_gap' | 'risk_account' | 'sla_breach' | 'deployment' | 'inspection_overdue';
  title: string;
  subtitle: string;
  href: string;
  priority: number;
}

export interface TerritoryCoverageItem {
  id: string;
  territoryName: string;
  accountCount: number;
  scheduledCount: number;
  coveragePct: number;
  status: 'ok' | 'partial' | 'gap';
}

export interface LiveDeploymentItem {
  id: string;
  accountName: string;
  deploymentType: string;
  stage: string;
  requestedAt: string;
  href: string;
}

export interface AccountHealthWatchlistItem {
  id: string;
  accountName: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  topReason: string | null;
  href: string;
}

export interface CrewCapacityItem {
  id: string;
  crewName: string;
  scheduledToday: number;
  capacity: number;
  utilizationPct: number;
  status: 'ok' | 'high' | 'over';
}

export interface UpcomingGoLiveItem {
  id: string;
  accountName: string;
  goLiveDate: string;
  deploymentType: string;
  href: string;
}

export interface OpsCommandCenterData {
  kpis: OpsCommandCenterKPIs;
  urgentActions: UrgentActionItem[];
  territoryCoverage: TerritoryCoverageItem[];
  liveDeployments: LiveDeploymentItem[];
  accountHealthWatchlist: AccountHealthWatchlistItem[];
  crewCapacity: CrewCapacityItem[];
  upcomingGoLives: UpcomingGoLiveItem[];
  userName: string;
  orgName: string | null;
}
