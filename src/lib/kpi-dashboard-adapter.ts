/**
 * Maps existing KPI data (kpi-strategic-data, kpi-data-context) to V2 dashboard components.
 * No schema changes; presentation layer only.
 */

import type { ExecutiveCardData, AttentionAlert, StrategicHealth } from '@/lib/kpi-metrics';
import type { OpsHealthCard } from '@/lib/kpi-strategic-data';
import type { KpiTileData } from '@/lib/kpi-metrics';

export type KpiStatus = 'healthy' | 'watch' | 'critical' | 'neutral';

function mapHealth(s: StrategicHealth | undefined): KpiStatus {
  if (!s) return 'neutral';
  if (s === 'green') return 'healthy';
  if (s === 'amber') return 'watch';
  if (s === 'red') return 'critical';
  return 'neutral';
}

function trendFromDelta(delta: number | undefined): 'up' | 'down' | 'flat' {
  if (delta == null) return 'flat';
  if (delta > 0) return 'up';
  if (delta < 0) return 'down';
  return 'flat';
}

/** Tier 1: exactly 3 cards — Total Active Contracts, MRR, Client Retention (with optional sparklines) */
export interface Tier1Card {
  id: string;
  label: string;
  value: string | number;
  deltaPct?: number;
  deltaLabel?: string;
  target?: string;
  trend: 'up' | 'down' | 'flat';
  sparkline?: number[];
  status: KpiStatus;
}

export function mapTier1Cards(executiveCards: ExecutiveCardData[]): Tier1Card[] {
  const byId: Record<string, ExecutiveCardData> = {};
  executiveCards.forEach((c) => { byId[c.id] = c; });
  const order = ['active_contracts', 'mrr', 'client_retention'] as const;
  return order
    .filter((id) => byId[id])
    .map((id) => {
      const c = byId[id];
      return {
        id: c.id,
        label: c.label,
        value: c.value,
        deltaPct: c.delta,
        deltaLabel: c.deltaLabel,
        target: c.targetBenchmark ? c.targetBenchmark.replace(/^Target:\s*/i, '').trim() : undefined,
        trend: trendFromDelta(c.delta),
        sparkline: c.sparkline,
        status: mapHealth(c.health),
      };
    });
}

/** Attention strip: top N items with severity watch | critical */
export interface AttentionStripItem {
  id: string;
  label: string;
  count: number;
  severity: 'watch' | 'critical';
}

export function mapAttentionStripItems(alerts: AttentionAlert[]): AttentionStripItem[] {
  return alerts.map((a) => ({
    id: a.id,
    label: a.label,
    count: a.count,
    severity: a.severity === 'critical' ? 'critical' : 'watch',
  }));
}

/** Tier 2: Pipeline Value, Closing Rate, Operational Health composite, SLA Compliance */
export interface Tier2Card {
  id: string;
  label: string;
  value: string | number;
  deltaPct?: number;
  deltaLabel?: string;
  target?: string;
  trend: 'up' | 'down' | 'flat';
  status: KpiStatus;
}

export function mapTier2SalesCards(salesMetrics: KpiTileData[]): Tier2Card[] {
  const pipeline = salesMetrics.find((m) => m.label.toLowerCase().includes('pipeline'));
  const closing = salesMetrics.find((m) => m.label.toLowerCase().includes('closing rate'));
  return [pipeline, closing].filter(Boolean).map((m) => ({
    id: m!.label.replace(/\s+/g, '_').toLowerCase(),
    label: m!.label,
    value: m!.value,
    deltaPct: m!.delta,
    deltaLabel: 'vs prior period',
    target: m!.targetBenchmark?.replace(/^Target:\s*/i, '').trim(),
    trend: trendFromDelta(m!.delta),
    status: mapHealth(m!.health),
  })) as Tier2Card[];
}

function pctToNumber(v: string | number): number {
  if (typeof v === 'number') return v;
  const m = String(v).match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : 0;
}

/** Composite ops score 0–100 from inspection completion, SLA, schedule adherence, issue recurrence */
export function computeOpsCompositeScore(opsCards: OpsHealthCard[]): { score: number; status: KpiStatus } {
  const inspection = opsCards.find((c) => c.id === 'inspection_completion');
  const sla = opsCards.find((c) => c.id === 'sla_compliance');
  const schedule = opsCards.find((c) => c.id === 'schedule_adherence');
  const issue = opsCards.find((c) => c.id === 'issue_recurrence');
  const values = [inspection, sla, schedule, issue].map((c) => (c ? pctToNumber(c.value) : 0));
  const issueInverted = issue ? 100 - pctToNumber(issue.value) : 100; // lower recurrence = better
  const score =
    values.filter((_, i) => i < 3).reduce((a, b) => a + b, 0) / 3 * 0.75 + issueInverted * 0.25;
  const rounded = Math.round(Math.min(100, Math.max(0, score)));
  const worst = [inspection, sla, schedule, issue].find((c) => c?.health === 'red');
  const hasAmber = [inspection, sla, schedule, issue].some((c) => c?.health === 'amber');
  const status: KpiStatus = worst ? 'critical' : hasAmber ? 'watch' : 'healthy';
  return { score: rounded, status };
}

export interface OpsSubmetric {
  label: string;
  valuePct: number;
  targetPct?: number;
  status: KpiStatus;
}

export function mapOpsSubmetrics(opsCards: OpsHealthCard[]): OpsSubmetric[] {
  const order = ['inspection_completion', 'sla_compliance', 'schedule_adherence', 'issue_recurrence'] as const;
  return order
    .map((id) => opsCards.find((c) => c.id === id))
    .filter(Boolean)
    .map((c) => ({
      label: c!.label,
      valuePct: pctToNumber(c!.value),
      targetPct: c!.target ? pctToNumber(c!.target) : undefined,
      status: mapHealth(c!.health),
    })) as OpsSubmetric[];
}

export function mapTier2OpsSlaCard(opsCards: OpsHealthCard[]): Tier2Card | null {
  const sla = opsCards.find((c) => c.id === 'sla_compliance');
  if (!sla) return null;
  return {
    id: sla.id,
    label: sla.label,
    value: sla.value,
    deltaPct: sla.delta,
    target: sla.target,
    trend: trendFromDelta(sla.delta),
    status: mapHealth(sla.health),
  };
}

/** Tier 3 micro pills: 6 items */
export interface MicroPillItem {
  id: string;
  label: string;
  value: string | number;
  deltaPct?: number;
  status?: KpiStatus;
}

export function mapMicroPillItems(
  executiveCards: ExecutiveCardData[],
  salesMetrics: KpiTileData[],
  opsCards: OpsHealthCard[]
): MicroPillItem[] {
  const byId: Record<string, ExecutiveCardData> = {};
  executiveCards.forEach((c) => { byId[c.id] = c; });
  const netGrowth = byId['net_revenue_growth'];
  const avgInspection = byId['avg_inspection_score'];
  const winRate = byId['win_rate'];
  const daysToClose = salesMetrics.find((m) => m.label.toLowerCase().includes('days to close'));
  const issueRecurrence = opsCards.find((c) => c.id === 'issue_recurrence');
  const sitesNoSupervisor = opsCards.find((c) => c.id === 'sites_no_supervisor');
  const items: MicroPillItem[] = [];
  if (netGrowth)
    items.push({
      id: 'net_revenue_growth',
      label: 'Net Revenue Growth',
      value: netGrowth.value,
      deltaPct: netGrowth.delta,
      status: mapHealth(netGrowth.health),
    });
  if (avgInspection)
    items.push({
      id: 'avg_inspection_score',
      label: 'Avg Inspection Score',
      value: avgInspection.value,
      deltaPct: avgInspection.delta,
      status: mapHealth(avgInspection.health),
    });
  if (winRate)
    items.push({
      id: 'win_rate',
      label: 'Win Rate (90d)',
      value: winRate.value,
      deltaPct: winRate.delta,
      status: mapHealth(winRate.health),
    });
  if (daysToClose)
    items.push({
      id: 'avg_days_to_close',
      label: 'Avg Days to Close',
      value: daysToClose.value,
      deltaPct: daysToClose.delta,
      status: mapHealth(daysToClose.health),
    });
  if (issueRecurrence)
    items.push({
      id: 'issue_recurrence',
      label: 'Issue Recurrence Rate',
      value: issueRecurrence.value,
      deltaPct: issueRecurrence.delta,
      status: mapHealth(issueRecurrence.health),
    });
  if (sitesNoSupervisor)
    items.push({
      id: 'sites_no_supervisor',
      label: 'Sites w/o Supervisor Visit',
      value: sitesNoSupervisor.value,
      deltaPct: sitesNoSupervisor.delta,
      status: mapHealth(sitesNoSupervisor.health),
    });
  return items;
}
