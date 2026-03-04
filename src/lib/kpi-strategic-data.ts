/**
 * Strategic Performance Dashboard — data selectors and placeholders.
 * Answers: Are we growing? Operations under control? Contracts at risk? Crews efficient? Performance gaps?
 *
 * TODO: Wire to real API when backend supports:
 * - Executive metrics (MRR, retention, win rate, inspection score)
 * - Attention alerts (accounts below threshold, uninspected contracts, SLA, NPS drop, stalled opps)
 * - Sales engine (pipeline, deal size, closing rate, days to close, stage breakdown)
 * - Operational health (inspection completion, SLA, schedule adherence, issue recurrence, supervisor visits)
 * - Crew performance (revenue per crew/supervisor, sites per crew, overtime %, task variance, efficiency index)
 */

import type {
  ExecutiveCardData,
  AttentionAlert,
  StrategicTimeframe,
  StrategicHealth,
} from '@/lib/kpi-metrics';
import type { KpiTileData } from '@/lib/kpi-metrics';

function spark(periods: number, trend: 'up' | 'flat' | 'down'): number[] {
  const out: number[] = [];
  let v = 80;
  for (let i = 0; i < periods; i++) {
    if (trend === 'up') v += Math.random() * 2 + 0.5;
    else if (trend === 'down') v -= Math.random() * 1.5;
    else v += (Math.random() - 0.5) * 1;
    out.push(Math.round(v * 10) / 10);
  }
  return out;
}

/** 1. Executive Snapshot — 6 large cards. Placeholder data; TODO: API */
export function getExecutiveSnapshot(timeframe: StrategicTimeframe): ExecutiveCardData[] {
  const isYtd = timeframe === 'ytd';
  const suffix = isYtd ? ' (YTD)' : timeframe === '90d' ? ' (90d)' : ' (30d)';
  return [
    {
      id: 'active_contracts',
      label: 'Total Active Contracts',
      value: 47,
      delta: 3.2,
      deltaLabel: 'vs prior period',
      targetBenchmark: 'Target: 50',
      sparkline: spark(12, 'up'),
      health: 'green',
    },
    {
      id: 'mrr',
      label: 'Monthly Recurring Revenue',
      value: '$312,400',
      delta: 2.1,
      deltaLabel: 'vs prior period',
      targetBenchmark: 'Target: $320k',
      sparkline: spark(12, 'up'),
      health: 'green',
    },
    {
      id: 'net_revenue_growth',
      label: 'Net Revenue Growth (MoM %)',
      value: '2.4%',
      delta: 0.8,
      deltaLabel: 'vs prior period',
      targetBenchmark: 'Target: 3%',
      sparkline: spark(12, 'flat'),
      health: 'amber',
    },
    {
      id: 'client_retention',
      label: `Client Retention Rate${isYtd ? ' (Rolling 12 months)' : ''}`,
      value: '94%',
      delta: 0.5,
      deltaLabel: 'vs prior period',
      targetBenchmark: 'Target: 95%',
      sparkline: spark(12, 'up'),
      health: 'green',
    },
    {
      id: 'avg_inspection_score',
      label: 'Avg Inspection Score (90-day rolling)',
      value: 91,
      delta: 1.2,
      deltaLabel: 'vs prior 90d',
      targetBenchmark: 'Target: 92',
      sparkline: spark(12, 'up'),
      health: 'green',
    },
    {
      id: 'win_rate',
      label: 'Win Rate (Last 90 days)',
      value: '48%',
      delta: 2,
      deltaLabel: 'vs prior 90d',
      targetBenchmark: 'Target: 50%',
      sparkline: spark(12, 'up'),
      health: 'amber',
    },
  ];
}

/** 2. Attention Required — only show if count > 0. Placeholder; TODO: API */
export function getAttentionAlerts(): AttentionAlert[] {
  // TODO: Query accounts below inspection threshold (e.g. <85), contracts not inspected 14+ days,
  // open issues past SLA, clients with NPS drop >10%, opportunities stalled 30+ days
  const alerts: AttentionAlert[] = [
    { id: 'accounts_below_threshold', label: 'Accounts below inspection threshold (<85)', count: 3, severity: 'warning', href: '/app/accounts?filter=below_threshold' },
    { id: 'contracts_not_inspected', label: 'Contracts not inspected in 14+ days', count: 2, severity: 'warning' },
    { id: 'issues_past_sla', label: 'Open issues past SLA', count: 1, severity: 'critical', href: '/app/issues' },
    { id: 'nps_declining', label: 'Clients with declining NPS (drop >10%)', count: 0, severity: 'warning' },
    { id: 'opps_stalled', label: 'Opportunities stalled 30+ days', count: 4, severity: 'warning', href: '/app/crm/pipeline' },
  ];
  return alerts.filter((a) => a.count > 0);
}

/** 3. Sales Engine Metrics. Placeholder; TODO: API */
export function getSalesEngineMetrics(timeframe: StrategicTimeframe): KpiTileData[] {
  return [
    { label: 'Pipeline Value', value: '$485,000', delta: 5.2, sparkline: spark(12, 'up'), health: 'green' },
    { label: 'Average Deal Size', value: '$7,200', delta: 1.8, sparkline: spark(12, 'flat'), health: 'green' },
    { label: 'Closing Rate (Trailing 90 days)', value: '48%', delta: 2, health: 'amber', targetBenchmark: 'Target: 50%' },
    { label: 'Avg Days to Close', value: 28, delta: -3, sparkline: spark(12, 'down'), health: 'green' },
    { label: 'Proposal Sent > 7 Days No Response', value: 5, delta: -1, health: 'amber' },
  ];
}

/** Opportunities by stage — for Sales Engine section. Placeholder; TODO: API */
export function getOpportunitiesByStage(): { stage: string; count: number }[] {
  return [
    { stage: 'Qualification', count: 8 },
    { stage: 'Proposal', count: 6 },
    { stage: 'Negotiation', count: 4 },
    { stage: 'Closed Won', count: 12 },
    { stage: 'Closed Lost', count: 5 },
  ];
}

/** 4. Operational Health — target, trend, color-coded status. Placeholder; TODO: API */
export interface OpsHealthCard {
  id: string;
  label: string;
  value: string | number;
  target?: string;
  delta?: number;
  health: StrategicHealth;
  sparkline?: number[];
}

export function getOperationalHealth(timeframe: StrategicTimeframe): OpsHealthCard[] {
  return [
    { id: 'inspection_completion', label: 'Inspection Completion Rate', value: '94%', target: '95%', delta: 2, health: 'green', sparkline: spark(12, 'up') },
    { id: 'avg_inspection', label: 'Avg Inspection Score', value: 91, target: '92', delta: 1, health: 'green', sparkline: spark(12, 'up') },
    { id: 'sla_compliance', label: 'SLA Compliance %', value: '87%', target: '95%', delta: -1, health: 'amber', sparkline: spark(12, 'down') },
    { id: 'schedule_adherence', label: 'Schedule Adherence %', value: '96%', target: '95%', delta: 0.5, health: 'green', sparkline: spark(12, 'flat') },
    { id: 'issue_recurrence', label: 'Issue Recurrence Rate', value: '8%', target: '<10%', delta: -0.5, health: 'green', sparkline: spark(12, 'down') },
    { id: 'sites_no_supervisor', label: 'Sites Without Supervisor Visit (14+ days)', value: 2, target: '0', delta: 0, health: 'amber' },
  ];
}

/** 5. Crew Performance. Placeholder; TODO: API */
export interface CrewMetricCard {
  id: string;
  label: string;
  value: string | number;
  delta?: number;
  target?: string;
  health?: StrategicHealth;
}

export function getCrewPerformance(timeframe: StrategicTimeframe): CrewMetricCard[] {
  return [
    { id: 'revenue_per_crew', label: 'Revenue per Crew', value: '$42,100', delta: 2.1, health: 'green' },
    { id: 'revenue_per_supervisor', label: 'Revenue per Supervisor', value: '$128,500', delta: 1.5, health: 'green' },
    { id: 'avg_sites_per_crew', label: 'Avg Sites per Crew', value: 4.2, delta: 0.2, health: 'green' },
    { id: 'overtime_pct', label: 'Overtime %', value: '6%', delta: -0.5, target: '<8%', health: 'green' },
    { id: 'task_completion_variance', label: 'Task Completion Variance', value: '4.2%', delta: -0.3, health: 'green' },
    { id: 'crew_efficiency_index', label: 'Crew Efficiency Index', value: '—', target: 'Composite (placeholder)', health: 'blue' },
  ];
}
