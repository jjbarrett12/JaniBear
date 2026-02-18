/**
 * Server-side data for Sales Command Center.
 * Uses RPC for metrics/leaderboard (RLS-safe); direct table read for stalled deals (rep sees own).
 */
import { createClient } from '@/lib/supabase/server';
import type { RepSalesMetrics, RepPipelineByStage, LeaderboardRow, StalledDeal } from '@/types/sales';

const STALLED_DAYS = 10;

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

export async function getSalesCommandCenterData(orgId: string, repId: string) {
  const [metrics, pipelineByStage, leaderboard, stalledDeals] = await Promise.all([
    getRepSalesMetrics(orgId, repId),
    getRepPipelineByStage(orgId, repId),
    getLeaderboardPublic(orgId),
    getStalledDeals(orgId, repId),
  ]);
  const myRank = leaderboard.find((r) => r.rep_id === repId);
  return {
    metrics,
    pipelineByStage,
    leaderboard,
    stalledDeals,
    myRank: myRank ?? null,
    totalReps: leaderboard.length,
  };
}
