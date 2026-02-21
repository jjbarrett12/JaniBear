/**
 * Server-side data for Sales Command Center.
 * Uses RPC for metrics/leaderboard (RLS-safe); direct table read for stalled deals (rep sees own).
 */
import { createClient } from '@/lib/supabase/server';
import type {
  RepSalesMetrics,
  RepPipelineByStage,
  LeaderboardRow,
  StalledDeal,
  PipelineStageHealth,
  SalesActionItem,
  RevenueLeakageSignal,
} from '@/types/sales';

const STALLED_DAYS = 10;
const STALLED_DAYS_AT_RISK = 14;

const STAGE_ORDER = [
  'prospect',
  'walkthrough',
  'drafted',
  'delivered',
  'negotiating',
  'verbal_yes',
  'signed',
];
const STAGE_LABELS: Record<string, string> = {
  prospect: 'Leads',
  walkthrough: 'Walkthrough',
  drafted: 'Proposal',
  delivered: 'Review',
  negotiating: 'Negotiating',
  verbal_yes: 'Verbal Yes',
  signed: 'Closed',
};

export async function getRepSalesMetrics(
  orgId: string,
  repId: string
): Promise<RepSalesMetrics | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_rep_sales_metrics_for_user', {
    p_org_id: orgId,
    p_rep_id: repId,
  });
  if (error || !data?.length) return null;
  return data[0] as RepSalesMetrics;
}

export async function getRepPipelineByStage(
  orgId: string,
  repId: string
): Promise<RepPipelineByStage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_rep_pipeline_by_stage', {
    p_org_id: orgId,
    p_rep_id: repId,
  });
  if (error) return [];
  return (data ?? []) as RepPipelineByStage[];
}

export async function getLeaderboardPublic(orgId: string): Promise<LeaderboardRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_leaderboard_public', {
    p_org_id: orgId,
  });
  if (error) return [];
  return (data ?? []) as LeaderboardRow[];
}

export async function getStalledDeals(orgId: string, repId: string): Promise<StalledDeal[]> {
  const supabase = await createClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - STALLED_DAYS);
  const { data, error } = await supabase
    .from('sales_proposals')
    .select('id, name, stage, estimated_mrr, last_activity_at')
    .eq('org_id', orgId)
    .eq('rep_id', repId)
    .eq('status', 'active')
    .lte('last_activity_at', cutoff.toISOString())
    .order('last_activity_at', { ascending: true });
  if (error) return [];
  return (data ?? []) as StalledDeal[];
}

/** Build pipeline health rows with count, value, avg days, conversion %, bottleneck. TODO: avg days + conversion from backend. */
export function buildPipelineStageHealth(
  pipelineByStage: RepPipelineByStage[]
): PipelineStageHealth[] {
  const stages = STAGE_ORDER.filter((s) => s !== 'signed');
  const totalPipeline = pipelineByStage.reduce((sum, r) => sum + r.sum_estimated_mrr, 0);
  // Mock avg days and conversion; bottleneck = proposal/delivered with high days + low movement
  const mockAvgDays: Record<string, number> = {
    prospect: 5,
    walkthrough: 12,
    drafted: 8,
    delivered: 14,
    negotiating: 7,
    verbal_yes: 3,
  };
  const mockConversion: Record<string, number> = {
    prospect: 60,
    walkthrough: 45,
    drafted: 70,
    delivered: 50,
    negotiating: 65,
    verbal_yes: 90,
  };
  return stages.map((stage, i) => {
    const row = pipelineByStage.find((r) => r.stage === stage);
    const count = row?.count_active ?? 0;
    const totalValue = row?.sum_estimated_mrr ?? 0;
    const avgDays = mockAvgDays[stage] ?? 7;
    const conversionPct = mockConversion[stage] ?? null;
    const isBottleneck =
      (stage === 'delivered' || stage === 'drafted') && avgDays >= 12 && count > 0;
    return {
      stage,
      stageLabel: STAGE_LABELS[stage] ?? stage,
      count,
      totalValue,
      avgDaysInStage: avgDays,
      conversionPct,
      isBottleneck,
    };
  });
}

/** Action queue: follow-ups due, proposals not viewed, stalled deals, etc. TODO: wire to activities/proposals. */
export async function getSalesActionQueue(
  orgId: string,
  repId: string,
  stalledDeals: StalledDeal[]
): Promise<SalesActionItem[]> {
  const items: SalesActionItem[] = [];
  stalledDeals.slice(0, 10).forEach((d, i) => {
    items.push({
      id: `stalled-${d.id}`,
      type: 'no_activity',
      title: d.name || 'Unnamed deal',
      subtitle: `${STAGE_LABELS[d.stage] ?? d.stage} · No activity 10+ days`,
      href: `/app/sales`,
      revenueImpact: d.estimated_mrr,
      urgency: d.estimated_mrr >= 500 ? 'high' : 'medium',
      stage: d.stage,
    });
  });
  // TODO: follow-ups due today from crm_activities / sales_cadence
  // TODO: proposals not viewed from sales_proposals
  // TODO: walkthroughs not scheduled from opportunities
  // Mock a couple for UI
  items.push({
    id: 'action-follow-up-1',
    type: 'follow_up_due',
    title: 'Riverside Office Park',
    subtitle: 'Follow-up due today',
    href: '/app/crm/opportunities',
    revenueImpact: 1200,
    urgency: 'high',
    dueDate: new Date().toISOString().slice(0, 10),
  });
  items.push({
    id: 'action-proposal-1',
    type: 'proposal_not_viewed',
    title: 'Tech Campus West',
    subtitle: 'Proposal sent 5 days ago · not viewed',
    href: '/app/proposals/build',
    revenueImpact: 800,
    urgency: 'medium',
  });
  return items.sort((a, b) => {
    const u = { high: 3, medium: 2, low: 1 };
    return (u[b.urgency] ?? 0) - (u[a.urgency] ?? 0);
  });
}

/** Revenue leakage signals. TODO: wire to lost bids, walkthrough conversion, proposal age. */
export async function getRevenueLeakageSignals(orgId: string): Promise<RevenueLeakageSignal[]> {
  return [
    { id: '1', type: 'lost_pricing', label: 'Lost bids (pricing)', count: 2, amount: 3400 },
    { id: '2', type: 'lost_scope', label: 'Lost bids (scope gap)', count: 1, amount: 1200 },
    { id: '3', type: 'walkthrough_not_converted', label: 'Walkthroughs not converted', count: 4 },
    { id: '4', type: 'proposal_sitting', label: 'Proposals sitting 7+ days', count: 3 },
  ].filter((s) => s.count > 0);
}

export async function getSalesCommandCenterData(orgId: string, repId: string) {
  const [metrics, pipelineByStage, leaderboard, stalledDeals] = await Promise.all([
    getRepSalesMetrics(orgId, repId),
    getRepPipelineByStage(orgId, repId),
    getLeaderboardPublic(orgId),
    getStalledDeals(orgId, repId),
  ]);
  const myRank = leaderboard.find((r) => r.rep_id === repId);
  const pipelineHealth = buildPipelineStageHealth(pipelineByStage);
  const actionQueue = await getSalesActionQueue(orgId, repId, stalledDeals);
  const leakageSignals = await getRevenueLeakageSignals(orgId);
  const openPipelineValue = pipelineByStage.reduce((s, r) => s + r.sum_estimated_mrr, 0);
  const dealsStalled14d = stalledDeals.length;
  return {
    metrics,
    pipelineByStage,
    pipelineHealth,
    leaderboard,
    stalledDeals,
    myRank: myRank ?? null,
    totalReps: leaderboard.length,
    actionQueue,
    leakageSignals,
    openPipelineValue,
    dealsStalled14d,
  };
}
