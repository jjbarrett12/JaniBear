/**
 * Command center dashboard — mock data and types.
 * Replace with Supabase queries later; keep the same shapes.
 */

export type DashboardPanelId =
  | 'buildings_today'
  | 'crew_today'
  | 'inspections_today'
  | 'health_below_threshold'
  | 'sla_breaches'
  | 'revenue_today';

export interface DashboardKpi {
  id: DashboardPanelId;
  title: string;
  value: string | number;
  delta?: { value: number; label: string }; // e.g. +12% vs yesterday
  sparkline?: number[]; // 7 values, 0–1 normalized or raw
}

export interface HealthAccountRow {
  id: string;
  accountName: string;
  siteName: string;
  healthScore: number;
  healthLabel: 'critical' | 'warning' | 'watch';
  reason: string;
  monthlyValueAtRisk: number;
  href: string;
}

export interface SlaRow {
  id: string;
  title: string;
  severity: 'high' | 'medium' | 'low';
  dueDate: string;
  assignee: string | null;
  href: string;
}

export interface InspectionRow {
  id: string;
  siteName: string;
  accountName: string;
  inspector: string | null;
  status: 'overdue' | 'due_today' | 'scheduled';
  dueDate: string;
  href: string;
}

export interface CrewGapRow {
  id: string;
  locationName: string;
  requiredCrews: number;
  assignedCrews: number;
  gap: number;
  href: string;
}

export interface BuildingRow {
  id: string;
  accountName: string;
  locationName: string;
  startTime: string | null;
  crewName: string | null;
  href: string;
}

export interface RevenueRow {
  id: string;
  accountName: string;
  amount: number;
  href: string;
}

export interface DashboardMockData {
  kpis: DashboardKpi[];
  healthAccounts: HealthAccountRow[];
  slaBreaches: SlaRow[];
  inspections: InspectionRow[];
  crewGaps: CrewGapRow[];
  buildingsToday: BuildingRow[];
  revenueToday: RevenueRow[];
  summaryMetric: Record<DashboardPanelId, { value: string | number; delta?: string }>;
}

const defaultSparkline = [0.4, 0.5, 0.45, 0.6, 0.65, 0.7, 0.68];

export function getMockDashboardData(_orgId: string): DashboardMockData {
  return {
    kpis: [
      { id: 'buildings_today', title: 'Buildings scheduled today', value: 24, delta: { value: 2, label: 'vs yesterday' }, sparkline: defaultSparkline },
      { id: 'crew_today', title: 'Crew active / required', value: '18 / 20', delta: { value: -1, label: 'gap' }, sparkline: [0.8, 0.82, 0.85, 0.88, 0.9, 0.88, 0.9] },
      { id: 'inspections_today', title: 'Inspections due today', value: 3, delta: { value: 0, label: 'vs yesterday' }, sparkline: [2, 1, 3, 2, 4, 2, 3].map((v) => v / 5) },
      { id: 'health_below_threshold', title: 'Accounts below health', value: 5, delta: { value: -1, label: 'improved' }, sparkline: [0.3, 0.28, 0.25, 0.22, 0.2, 0.18, 0.15] },
      { id: 'sla_breaches', title: 'SLA breaches / overdue', value: 2, delta: { value: 1, label: 'need attention' }, sparkline: [0.1, 0.15, 0.12, 0.08, 0.1, 0.12, 0.08] },
      { id: 'revenue_today', title: 'Revenue scheduled today', value: '$9,912', delta: { value: 4, label: '% vs yesterday' }, sparkline: defaultSparkline },
    ],
    healthAccounts: [
      { id: '1', accountName: 'Acme Corp', siteName: 'Downtown Tower', healthScore: 42, healthLabel: 'critical', reason: '2 missed inspections', monthlyValueAtRisk: 4200, href: '/app/accounts/1' },
      { id: '2', accountName: 'Beta Industries', siteName: 'North Campus', healthScore: 58, healthLabel: 'warning', reason: 'Declining checklist score', monthlyValueAtRisk: 3100, href: '/app/accounts/2' },
    ],
    slaBreaches: [
      { id: 's1', title: 'Inspection overdue – Downtown Tower', severity: 'high', dueDate: '2025-02-20', assignee: 'Jane Doe', href: '/app/inspections/1' },
      { id: 's2', title: 'Follow-up visit – North Campus', severity: 'medium', dueDate: '2025-02-21', assignee: null, href: '/app/ops/issues-sla' },
    ],
    inspections: [
      { id: 'i1', siteName: 'Downtown Tower', accountName: 'Acme Corp', inspector: 'Jane Doe', status: 'overdue', dueDate: 'Today', href: '/app/inspections/1' },
      { id: 'i2', siteName: 'North Campus', accountName: 'Beta Industries', inspector: null, status: 'due_today', dueDate: 'Today 2pm', href: '/app/inspections/2' },
      { id: 'i3', siteName: 'West Plaza', accountName: 'Gamma LLC', inspector: 'John Smith', status: 'scheduled', dueDate: 'Today 4pm', href: '/app/inspections/3' },
    ],
    crewGaps: [
      { id: 'c1', locationName: 'East Warehouse', requiredCrews: 2, assignedCrews: 1, gap: 1, href: '/app/ops/launch-intake' },
    ],
    buildingsToday: [
      { id: 'b1', accountName: 'Acme Corp', locationName: 'Downtown Tower', startTime: '18:00', crewName: 'Crew A', href: '/app/schedule' },
      { id: 'b2', accountName: 'Beta Industries', locationName: 'North Campus', startTime: '19:00', crewName: 'Crew B', href: '/app/schedule' },
      { id: 'b3', accountName: 'Gamma LLC', locationName: 'West Plaza', startTime: '20:00', crewName: null, href: '/app/schedule' },
    ],
    revenueToday: [
      { id: 'r1', accountName: 'Acme Corp', amount: 4200, href: '/app/accounts/1' },
      { id: 'r2', accountName: 'Beta Industries', amount: 3100, href: '/app/accounts/2' },
      { id: 'r3', accountName: 'Gamma LLC', amount: 2612, href: '/app/accounts/3' },
    ],
    summaryMetric: {
      buildings_today: { value: 24, delta: '+2' },
      crew_today: { value: '18 / 20', delta: '1 gap' },
      inspections_today: { value: 3, delta: '0' },
      health_below_threshold: { value: 5, delta: '-1' },
      sla_breaches: { value: 2, delta: '2 need attention' },
      revenue_today: { value: '$9,912', delta: '+4%' },
    },
  };
}
