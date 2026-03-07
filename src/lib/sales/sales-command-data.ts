/**
 * Sales Command view data: action-first revenue board.
 * Answers: What should I work first? What deals are closest to revenue? What is stuck?
 */

import { createClient } from '@/lib/supabase/server';

export interface SalesCommandKpis {
  pipelineValue: number;
  proposalValueOut: number;
  walkthroughsThisWeek: number;
  dealsClosingThisMonth: number;
  stalledDeals: number;
  leadsRequiringTouchToday: number;
  leadsNeedingFirstContact: number;
  hotLeads: number;
  winRate: number | null;
  weightedPipeline?: number;
}

export interface SalesCommandCardItem {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  value?: number;
  date?: string;
  stage?: string;
  score?: number;
  source?: string;
}

export interface LeaderboardRow {
  repId: string;
  repName: string | null;
  rank: number;
  walkthroughsBooked: number;
  walkthroughsCompleted: number;
  proposalsSent: number;
  wonRevenue: number;
  winRate: number | null;
  avgDealSize: number | null;
}

export interface SourcePerformanceRow {
  source: string;
  leadCount: number;
  qualifiedCount: number;
  walkthroughCount: number;
  wonCount: number;
  wonRevenue: number;
}

export interface LostReasonRow {
  reason: string;
  count: number;
  revenue: number;
}

export interface SalesCommandData {
  kpis: SalesCommandKpis;
  huntNow: SalesCommandCardItem[];
  bookWalkthroughs: SalesCommandCardItem[];
  moveDeals: SalesCommandCardItem[];
  closeRevenue: SalesCommandCardItem[];
  leaderboard: LeaderboardRow[];
  sourcePerformance: SourcePerformanceRow[];
  lostReasonSnapshot: LostReasonRow[];
  recentWins: SalesCommandCardItem[];
  userName: string | null;
  orgName: string | null;
}

const STALE_DAYS = 7;

export async function getSalesCommandData(orgId: string, userId: string): Promise<SalesCommandData> {
  const supabase = await createClient();

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Leads: my leads or org-wide depending on role (simplified: filter by assigned_user_id or org)
  const leadsQuery = supabase
    .from('leads')
    .select('id, company, contact_name, status, lead_score, source, next_follow_up_at, assigned_user_id, converted_opportunity_id, created_at')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(500);

  const oppsQuery = supabase
    .from('opportunities')
    .select('id, stage, est_mrr, est_value, expected_close_date, account_id, next_action_due, owner_id')
    .eq('org_id', orgId)
    .or('closed_at.is.null,closed_at.gte.1900-01-01')
    .limit(300);

  const walkthroughsQuery = supabase
    .from('walkthroughs')
    .select('id, scheduled_at, status, lead_id, opportunity_id')
    .eq('org_id', orgId)
    .gte('scheduled_at', weekStart.toISOString())
    .lte('scheduled_at', weekEnd.toISOString());

  const proposalsQuery = supabase
    .from('proposals')
    .select('id, total_amount, status, sent_at, lead_id, opportunity_id')
    .eq('org_id', orgId);

  const salesProposalsQuery = supabase
    .from('sales_proposals')
    .select('id, name, stage, estimated_mrr, delivered_at, status, last_activity_at, rep_id')
    .eq('org_id', orgId)
    .eq('rep_id', userId);

  const salesProposalsAllRepsQuery = supabase
    .from('sales_proposals')
    .select('id, rep_id, estimated_mrr, delivered_at, status')
    .eq('org_id', orgId);

  const [leadsRes, oppsRes, walkthroughsRes, proposalsRes, salesProposalsRes, salesProposalsAllRes, profileRes, orgRes] = await Promise.all([
    leadsQuery,
    oppsQuery,
    walkthroughsQuery,
    proposalsQuery,
    salesProposalsQuery,
    salesProposalsAllRepsQuery,
    supabase.from('profiles').select('full_name').eq('id', userId).maybeSingle(),
    supabase.from('organizations').select('name').eq('id', orgId).maybeSingle(),
  ]);

  const leads = leadsRes.data ?? [];
  const opps = oppsRes.data ?? [];
  const walkthroughs = walkthroughsRes.data ?? [];
  const proposals = proposalsRes.data ?? [];
  const salesProposals = salesProposalsRes.data ?? [];
  const salesProposalsAllReps = salesProposalsAllRes.data ?? [];

  type LeadRow = { id: string; company?: string | null; contact_name?: string | null; status: string; lead_score?: number | null; source?: string; next_follow_up_at?: string | null; assigned_user_id?: string | null; converted_opportunity_id?: string | null; created_at: string };
  type OppRow = { id: string; stage: string; est_mrr?: number | null; est_value?: number | null; expected_close_date?: string | null; next_action_due?: string | null; owner_id?: string | null };
  type WalkRow = { id: string; scheduled_at?: string | null; status: string; lead_id?: string | null };
  type PropRow = { id: string; total_amount?: number | null; status: string; sent_at?: string | null };
  type SalesPropRow = { id: string; name?: string | null; stage: string; estimated_mrr?: number | null; delivered_at?: string | null; status: string; last_activity_at?: string | null };

  const leadRows = leads as LeadRow[];
  const oppRows = opps as OppRow[];
  const walkRows = walkthroughs as WalkRow[];
  const propRows = proposals as PropRow[];
  const salesPropRows = salesProposals as SalesPropRow[];

  const activeOpps = oppRows.filter((o) => o.stage !== 'closed_won' && o.stage !== 'closed_lost');
  const pipelineValue = activeOpps.reduce((s, o) => s + (Number(o.est_mrr) || Number(o.est_value) || 0), 0) ||
    salesPropRows.filter((p) => p.status === 'active').reduce((s, p) => s + (Number(p.estimated_mrr) || 0), 0);
  const proposalValueOut = propRows.filter((p) => p.status === 'sent' || p.status === 'viewed').reduce((s, p) => s + (Number(p.total_amount) || 0), 0) ||
    salesPropRows.filter((p) => p.delivered_at).reduce((s, p) => s + (Number(p.estimated_mrr) || 0) * 12, 0);
  const walkthroughsThisWeek = walkRows.length;
  const dealsClosingThisMonth = oppRows.filter((o) => o.expected_close_date && o.expected_close_date <= monthEnd.toISOString().slice(0, 10) && o.stage !== 'closed_lost').length;
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().slice(0, 10);
  const todayEnd = todayStart + 'T23:59:59.999Z';
  const leadsRequiringTouchToday = leadRows.filter(
    (l) => l.next_follow_up_at && l.next_follow_up_at >= todayStart && l.next_follow_up_at <= todayEnd && !l.converted_opportunity_id
  ).length;

  const staleCutoff = new Date();
  staleCutoff.setDate(staleCutoff.getDate() - STALE_DAYS);
  const stalledDeals = salesPropRows.filter((p) => p.status === 'active' && p.last_activity_at && new Date(p.last_activity_at) < staleCutoff).length ||
    activeOpps.filter((o) => o.next_action_due && new Date(o.next_action_due) < staleCutoff).length;
  const leadsNeedingFirstContact = leadRows.filter((l) => (l.status === 'new' || l.status === 'enriched') && !l.converted_opportunity_id).length;
  const hotLeads = leadRows.filter((l) => (l.lead_score ?? 0) >= 70 && !l.converted_opportunity_id).length;
  const won = salesPropRows.filter((p) => p.status === 'won').length;
  const lost = salesPropRows.filter((p) => p.status === 'lost').length;
  const oppWon = oppRows.filter((o) => o.stage === 'won').length;
  const oppLost = oppRows.filter((o) => o.stage === 'lost').length;
  const totalWon = won + oppWon;
  const totalLost = lost + oppLost;
  const winRate = totalWon + totalLost > 0 ? Math.round((totalWon / (totalWon + totalLost)) * 100) : null;

  const kpis: SalesCommandKpis = {
    pipelineValue,
    proposalValueOut,
    walkthroughsThisWeek,
    dealsClosingThisMonth,
    stalledDeals,
    leadsRequiringTouchToday,
    leadsNeedingFirstContact,
    hotLeads,
    winRate,
  };

  const huntNow: SalesCommandCardItem[] = [];
  leadRows.filter((l) => !l.converted_opportunity_id && (l.lead_score ?? 0) >= 60).slice(0, 5).forEach((l) => {
    huntNow.push({
      id: l.id,
      title: l.company || l.contact_name || 'Unknown',
      subtitle: l.contact_name || l.company || undefined,
      href: `/app/sales/leads/${l.id}`,
      score: l.lead_score ?? undefined,
      source: l.source,
    });
  });
  leadRows.filter((l) => !l.assigned_user_id && !l.converted_opportunity_id).slice(0, 3).forEach((l) => {
    if (!huntNow.some((h) => h.id === l.id)) huntNow.push({
      id: `unassigned-${l.id}`,
      title: l.company || l.contact_name || 'Unassigned',
      href: `/app/sales/leads/${l.id}`,
      subtitle: 'Unassigned',
    });
  });

  const bookWalkthroughs: SalesCommandCardItem[] = [];
  leadRows.filter((l) => l.status === 'qualified' && !l.converted_opportunity_id).slice(0, 5).forEach((l) => {
    bookWalkthroughs.push({
      id: l.id,
      title: l.company || l.contact_name || 'Lead',
      href: `/app/sales/leads/${l.id}`,
      subtitle: 'Qualified · no walkthrough',
    });
  });
  leadRows.filter((l) => l.next_follow_up_at && new Date(l.next_follow_up_at) < now).slice(0, 3).forEach((l) => {
    bookWalkthroughs.push({
      id: `followup-${l.id}`,
      title: l.company || l.contact_name || 'Lead',
      href: `/app/sales/leads/${l.id}`,
      subtitle: 'Overdue follow-up',
      date: l.next_follow_up_at ?? undefined,
    });
  });

  const moveDeals: SalesCommandCardItem[] = [];
  activeOpps.filter((o) => o.stage === 'qualified' || o.stage === 'walkthrough_completed' || o.stage === 'scoping').slice(0, 4).forEach((o) => {
    moveDeals.push({
      id: o.id,
      title: 'Opportunity',
      href: `/app/crm/opportunities/${o.id}`,
      stage: o.stage,
      value: Number(o.est_mrr) || Number(o.est_value) || undefined,
    });
  });
  salesPropRows.filter((p) => p.status === 'active' && (p.stage === 'delivered' || p.stage === 'negotiating')).slice(0, 3).forEach((p) => {
    moveDeals.push({
      id: p.id,
      title: p.name || 'Proposal',
      href: '/app/sales/proposals',
      stage: p.stage,
      value: Number(p.estimated_mrr) || undefined,
    });
  });

  const closeRevenue: SalesCommandCardItem[] = [];
  oppRows.filter((o) => o.expected_close_date && o.expected_close_date >= now.toISOString().slice(0, 10) && o.stage !== 'closed_lost').slice(0, 5).forEach((o) => {
    closeRevenue.push({
      id: o.id,
      title: 'Deal',
      href: `/app/crm/opportunities/${o.id}`,
      value: Number(o.est_mrr) || Number(o.est_value) || undefined,
      date: o.expected_close_date ?? undefined,
    });
  });
  activeOpps.filter((o) => (Number(o.est_mrr) || Number(o.est_value) || 0) >= 2000).slice(0, 3).forEach((o) => {
    if (!closeRevenue.some((c) => c.id === o.id)) closeRevenue.push({
      id: o.id,
      title: 'High value',
      href: `/app/crm/opportunities/${o.id}`,
      value: Number(o.est_mrr) || Number(o.est_value) || undefined,
      stage: o.stage,
    });
  });

  const userName = profileRes.data?.full_name ?? null;
  const orgName = orgRes.data?.name ?? null;

  // Leaderboard: by rep from org-wide sales_proposals
  const leaderboard: LeaderboardRow[] = [];
  const allRepRows = salesProposalsAllReps as { rep_id?: string; status: string; estimated_mrr?: number; delivered_at?: string }[];
  const repIds = new Set<string>(allRepRows.map((p) => p.rep_id).filter(Boolean) as string[]);
  if (repIds.size === 0) repIds.add(userId);
  const profilesRes = await supabase.from('profiles').select('id, full_name').in('id', Array.from(repIds));
  const profiles = (profilesRes.data ?? []) as { id: string; full_name: string | null }[];
  profiles.forEach((p) => {
    const repProps = allRepRows.filter((r) => r.rep_id === p.id);
    const won = repProps.filter((r) => r.status === 'won');
    const wonRev = won.reduce((s, r) => s + (Number(r.estimated_mrr) || 0) * 12, 0);
    const lost = repProps.filter((r) => r.status === 'lost');
    leaderboard.push({
      repId: p.id,
      repName: p.full_name,
      rank: 0,
      walkthroughsBooked: 0,
      walkthroughsCompleted: 0,
      proposalsSent: repProps.filter((r) => r.delivered_at).length,
      wonRevenue: wonRev,
      winRate: won.length + lost.length > 0 ? Math.round((won.length / (won.length + lost.length)) * 100) : null,
      avgDealSize: won.length > 0 ? wonRev / 12 / won.length : null,
    });
  });
  leaderboard.sort((a, b) => b.wonRevenue - a.wonRevenue);
  leaderboard.forEach((r, i) => { r.rank = i + 1; });

  // Source performance: by lead source
  const bySource = new Map<string, { lead: number; qualified: number; wt: number; won: number; revenue: number }>();
  leadRows.forEach((l) => {
    const src = l.source ?? 'other';
    const cur = bySource.get(src) ?? { lead: 0, qualified: 0, wt: 0, won: 0, revenue: 0 };
    cur.lead++;
    if (l.status === 'qualified' || l.status === 'walkthrough_scheduled' || l.status === 'walkthrough_completed') cur.qualified++;
    bySource.set(src, cur);
  });
  const sourcePerformance: SourcePerformanceRow[] = Array.from(bySource.entries()).map(([source, v]) => ({
    source,
    leadCount: v.lead,
    qualifiedCount: v.qualified,
    walkthroughCount: v.wt,
    wonCount: v.won,
    wonRevenue: v.revenue,
  }));

  // Lost reason snapshot (from opportunities or sales_proposals — simplified; wire to loss_reason when available)
  const lostReasonSnapshot: LostReasonRow[] = [];
  if (lost > 0) lostReasonSnapshot.push({ reason: 'other', count: lost, revenue: 0 });

  // Recent wins
  const recentWins: SalesCommandCardItem[] = salesPropRows
    .filter((p: { status: string }) => p.status === 'won')
    .slice(0, 5)
    .map((p: { id: string; name?: string; estimated_mrr?: number }) => ({
      id: p.id,
      title: p.name || 'Won deal',
      href: '/app/sales/proposals',
      value: Number(p.estimated_mrr) || undefined,
    }));

  return {
    kpis,
    huntNow: huntNow.slice(0, 8),
    bookWalkthroughs: bookWalkthroughs.slice(0, 8),
    moveDeals: moveDeals.slice(0, 8),
    closeRevenue: closeRevenue.slice(0, 8),
    leaderboard,
    sourcePerformance,
    lostReasonSnapshot,
    recentWins,
    userName,
    orgName,
  };
}
