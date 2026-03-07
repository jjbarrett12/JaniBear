/**
 * Owner Command Center: server-side aggregates scoped by org_id.
 * Used by /app/dashboard. Cache with revalidate: 60.
 */
import { unstable_cache } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

const TODAY = new Date().toISOString().slice(0, 10);
const YESTERDAY = new Date(Date.now() - 864e5).toISOString().slice(0, 10);

function startOfWeek(d: Date): string {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

function startOfMonth(d: Date): string {
  const m = new Date(d.getFullYear(), d.getMonth(), 1);
  return m.toISOString().slice(0, 10);
}

export type RevenuePulse = {
  todayTotal: number;
  wtdTotal: number;
  monthlyTarget: number;
  monthPacingPct: number | null; // vs monthly target; null if no target
};

export type RiskAlert = {
  openComplaints: number;
  failedInspectionsLast7: number;
  accountsBelow60: number;
  contractsExpiring30: number;
  totalRisk: number;
};

export type CrewStatus = {
  crewsClockedIn: number;
  lateStarts: number;
  callOffsToday: number;
  jobsNotStarted: number;
  totalCrews: number;
};

export type AccountHealth = {
  pctAbove80: number;
  countBelow60: number;
  visitsDueToday: number;
  totalAccounts: number;
  greenPct: number;
  yellowPct: number;
  redPct: number;
};

export type QualitySnapshot = {
  inspectionsYesterday: number;
  avgScore: number | null;
  locationsUnder85: number;
};

export type ARSnapshot = {
  totalOutstanding: number;
  overdue30: number;
  overdue60: number;
  overdue90: number;
};

/** Overdue amount (30+60+90) and count of invoices past due. For Financial Health and alerts. */
export type ARSnapshotExtended = ARSnapshot & {
  overdueTotal: number;
  overdueInvoiceCount: number;
};

export type PipelineSnapshot = {
  openBids: number;
  pipelineValue: number;
  followUpsDueToday: number;
  winRate30Pct: number | null;
};

export type AIInsight = {
  sitesOverLaborBudget: string[];
  staffingAlerts: string[];
  riskPatterns: string[];
  hasAlerts: boolean;
};

/** Buildings/sites scheduled for service today (for cockpit KPI strip). */
export type BuildingsScheduledToday = number;

/** Inspections due today (for cockpit KPI strip). */
export type InspectionsDueToday = number;

export type CommandCenterData = {
  revenue: RevenuePulse;
  risk: RiskAlert;
  crew: CrewStatus;
  accountHealth: AccountHealth;
  quality: QualitySnapshot;
  ar: ARSnapshot;
  pipeline: PipelineSnapshot;
  ai: AIInsight;
  userName: string;
  /** For cockpit: count of buildings/sites scheduled today. */
  buildingsScheduledToday?: number;
  /** For cockpit: inspections due today. */
  inspectionsDueToday?: number;
  /** When this data was fetched (ISO string). For "Data as of" trust signal in UI. */
  fetchedAt?: string;
};

const ZERO_REVENUE: RevenuePulse = {
  todayTotal: 0,
  wtdTotal: 0,
  monthlyTarget: 0,
  monthPacingPct: null,
};

const ZERO_RISK: RiskAlert = {
  openComplaints: 0,
  failedInspectionsLast7: 0,
  accountsBelow60: 0,
  contractsExpiring30: 0,
  totalRisk: 0,
};

const ZERO_CREW: CrewStatus = {
  crewsClockedIn: 0,
  lateStarts: 0,
  callOffsToday: 0,
  jobsNotStarted: 0,
  totalCrews: 0,
};

const ZERO_ACCOUNT: AccountHealth = {
  pctAbove80: 0,
  countBelow60: 0,
  visitsDueToday: 0,
  totalAccounts: 0,
  greenPct: 0,
  yellowPct: 0,
  redPct: 0,
};

const ZERO_QUALITY: QualitySnapshot = {
  inspectionsYesterday: 0,
  avgScore: null,
  locationsUnder85: 0,
};

const ZERO_AR: ARSnapshot = {
  totalOutstanding: 0,
  overdue30: 0,
  overdue60: 0,
  overdue90: 0,
};

const ZERO_PIPELINE: PipelineSnapshot = {
  openBids: 0,
  pipelineValue: 0,
  followUpsDueToday: 0,
  winRate30Pct: null,
};

const ZERO_AI: AIInsight = {
  sitesOverLaborBudget: [],
  staffingAlerts: [],
  riskPatterns: [],
  hasAlerts: false,
};

const FALLBACK_DATA: CommandCenterData = {
  revenue: ZERO_REVENUE,
  risk: ZERO_RISK,
  crew: ZERO_CREW,
  accountHealth: ZERO_ACCOUNT,
  quality: ZERO_QUALITY,
  ar: ZERO_AR,
  pipeline: ZERO_PIPELINE,
  ai: ZERO_AI,
  userName: 'there',
};

const CACHE_REVALIDATE_SECONDS = 60;

export async function getCommandCenterData(orgId: string): Promise<CommandCenterData> {
  try {
    return await unstable_cache(
      () => getCommandCenterDataInner(orgId),
      ['command-center', orgId],
      { revalidate: CACHE_REVALIDATE_SECONDS }
    )();
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[getCommandCenterData]', e);
    }
    return FALLBACK_DATA;
  }
}

async function getCommandCenterDataInner(orgId: string): Promise<CommandCenterData> {
  const supabase = await createClient();
  const now = new Date();
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 864e5).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 864e5).toISOString();

  const [
    invoicesToday,
    invoicesWtd,
    invoicesMonth,
    accountsWithTarget,
    issuesOpen,
    inspectionsLast7,
    accountsList,
    contractRenewals,
    crewsList,
    workOrdersPending,
    schedulesToday,
    facilitiesList,
    inspectionsScores,
    inspectionsYesterday,
    invoicesAR,
    bidsOpen,
    salesProposals,
    crmActivitiesToday,
    bidsWon30,
    bidsLost30,
  ] = await Promise.all([
    supabase.from('invoices').select('total_amount').eq('org_id', orgId).eq('invoice_date', TODAY).in('status', ['sent', 'viewed', 'paid']),
    supabase.from('invoices').select('total_amount').eq('org_id', orgId).eq('status', 'paid').gte('payment_date', weekStart),
    supabase.from('invoices').select('total_amount').eq('org_id', orgId).eq('status', 'paid').gte('payment_date', monthStart),
    supabase.from('accounts').select('contract_value_monthly').eq('org_id', orgId).not('contract_value_monthly', 'is', null),
    supabase.from('issues').select('id', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'open'),
    supabase.from('inspections').select('id, total_score').eq('org_id', orgId).gte('created_at', sevenDaysAgo).not('total_score', 'is', null),
    supabase.from('accounts').select('id').eq('org_id', orgId).eq('status', 'active').limit(5000),
    supabase.from('contract_renewals').select('id').eq('org_id', orgId).lt('expires_at', new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10)).gte('expires_at', TODAY).in('renewal_status', ['upcoming', 'notified_90d', 'notified_60d', 'notified_30d', 'proposal_sent', 'negotiating']).catch(() => ({ data: [], count: 0 })),
    supabase.from('crews').select('id', { count: 'exact', head: true }).eq('org_id', orgId),
    supabase.from('work_orders').select('id', { count: 'exact', head: true }).eq('org_id', orgId).in('status', ['pending', 'assigned']).lte('sla_deadline', new Date(now.getTime() + 864e5).toISOString()).catch(() => ({ count: 0 })),
    supabase.from('schedules').select('id, recurrence, weekday, start_date').eq('org_id', orgId).eq('is_active', true).catch(() => ({ data: [] })),
    supabase.from('facilities').select('id, account_id').eq('org_id', orgId).limit(5000),
    supabase.from('inspections').select('facility_id, total_score').eq('org_id', orgId).not('total_score', 'is', null).gte('created_at', thirtyDaysAgo).limit(10000),
    supabase.from('inspections').select('id, facility_id, total_score').eq('org_id', orgId).gte('created_at', YESTERDAY + 'T00:00:00').lt('created_at', TODAY + 'T00:00:00'),
    supabase.from('invoices').select('total_amount, due_date, status').eq('org_id', orgId).not('status', 'in', '("paid","cancelled","refunded")').limit(AR_SNAPSHOT_LIMIT),
    supabase.from('bids').select('id, total_estimated_cost').eq('org_id', orgId).in('status', ['draft', 'sent', 'accepted']),
    supabase.from('sales_proposals').select('id, proposal_value').eq('org_id', orgId).eq('status', 'active').catch(() => ({ data: [] })),
    supabase.from('crm_activities').select('id', { count: 'exact', head: true }).eq('org_id', orgId).eq('due_date', TODAY).catch(() => ({ count: 0 })),
    supabase.from('bids').select('id', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'accepted').gte('updated_at', thirtyDaysAgo).catch(() => ({ count: 0 })),
    supabase.from('bids').select('id', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'rejected').gte('updated_at', thirtyDaysAgo).catch(() => ({ count: 0 })),
  ]);

  const { data: user } = await supabase.auth.getUser();
  const { data: profile } = user?.user
    ? await supabase.from('profiles').select('full_name').eq('id', user.user.id).single().catch(() => null)
    : { data: null };

  // Revenue
  const todayTotal = (invoicesToday.data ?? []).reduce((s, i) => s + (Number(i.total_amount) || 0), 0);
  const wtdTotal = (invoicesWtd.data ?? []).reduce((s, i) => s + (Number(i.total_amount) || 0), 0);
  const monthPaid = (invoicesMonth.data ?? []).reduce((s, i) => s + (Number(i.total_amount) || 0), 0);
  const monthlyTarget = (accountsWithTarget.data ?? []).reduce((s, a) => s + (Number(a.contract_value_monthly) || 0), 0);
  const monthPacingPct = monthlyTarget > 0 ? Math.round((monthPaid / monthlyTarget) * 100) : null;

  const revenue: RevenuePulse = {
    todayTotal,
    wtdTotal,
    monthlyTarget,
    monthPacingPct,
  };

  // Risk
  const openComplaints = issuesOpen.count ?? 0;
  const inspections7 = inspectionsLast7.data ?? [];
  const failedInspectionsLast7 = inspections7.filter((i: { total_score: number | null }) => (i.total_score ?? 0) < 70).length;
  const accountIds = new Set((accountsList.data ?? []).map((a: { id: string }) => a.id));
  const facilityToAccount = new Map<string, string>();
  (facilitiesList.data ?? []).forEach((f: { id: string; account_id: string }) => facilityToAccount.set(f.id, f.account_id));
  const scoresByAccount = new Map<string, number[]>();
  (inspectionsScores.data ?? []).forEach((r: { facility_id: string; total_score: number | null }) => {
    const accId = facilityToAccount.get(r.facility_id);
    if (accId && r.total_score != null) {
      if (!scoresByAccount.has(accId)) scoresByAccount.set(accId, []);
      scoresByAccount.get(accId)!.push(r.total_score);
    }
  });
  let accountsBelow60 = 0;
  scoresByAccount.forEach((scores) => {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    if (avg < 60) accountsBelow60++;
  });
  const contractsExpiring30 = (contractRenewals.data ?? []).length;
  const totalRisk = openComplaints + failedInspectionsLast7 + accountsBelow60 + contractsExpiring30;

  const risk: RiskAlert = {
    openComplaints,
    failedInspectionsLast7,
    accountsBelow60,
    contractsExpiring30,
    totalRisk,
  };

  // Crew (no real clock-in/late/call-off in schema; use crews count and work_orders)
  const totalCrews = crewsList.count ?? 0;
  const jobsNotStarted = workOrdersPending.count ?? 0;
  const crew: CrewStatus = {
    crewsClockedIn: totalCrews,
    lateStarts: 0,
    callOffsToday: 0,
    jobsNotStarted,
    totalCrews,
  };

  // Account health: % above 80, count below 60, visits due today, bar
  const totalAccounts = accountIds.size || 1;
  let above80 = 0;
  let below60 = 0;
  let yellow = 0;
  scoresByAccount.forEach((scores) => {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    if (avg >= 80) above80++;
    else if (avg < 60) below60++;
    else yellow++;
  });
  const todayDay = now.getDay();
  const todaySchedules = (schedulesToday.data ?? []).filter(
    (s: { recurrence: string; weekday: number | null; start_date: string }) =>
      s.recurrence === 'weekly' ? s.weekday === todayDay : s.start_date === TODAY
  );
  const buildingsScheduledToday = todaySchedules.length;
  const visitsDueToday = buildingsScheduledToday;
  const accountHealth: AccountHealth = {
    pctAbove80: totalAccounts ? Math.round((above80 / totalAccounts) * 100) : 0,
    countBelow60: below60,
    visitsDueToday,
    totalAccounts,
    greenPct: totalAccounts ? (above80 / totalAccounts) * 100 : 0,
    yellowPct: totalAccounts ? (yellow / totalAccounts) * 100 : 0,
    redPct: totalAccounts ? (below60 / totalAccounts) * 100 : 0,
  };

  // Quality
  const inspYesterday = inspectionsYesterday.data ?? [];
  const inspectionsYesterdayCount = inspYesterday.length;
  const avgScore = inspYesterday.length ? inspYesterday.reduce((s: number, i: { total_score: number | null }) => s + (i.total_score ?? 0), 0) / inspYesterday.length : null;
  const facilityScoresYesterday = new Map<string, number[]>();
  inspYesterday.forEach((i: { facility_id: string; total_score: number | null }) => {
    if (i.total_score != null) {
      if (!facilityScoresYesterday.has(i.facility_id)) facilityScoresYesterday.set(i.facility_id, []);
      facilityScoresYesterday.get(i.facility_id)!.push(i.total_score);
    }
  });
  let locationsUnder85 = 0;
  facilityScoresYesterday.forEach((scores) => {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    if (avg < 85) locationsUnder85++;
  });
  const quality: QualitySnapshot = {
    inspectionsYesterday: inspectionsYesterdayCount,
    avgScore: avgScore != null ? Math.round(avgScore) : null,
    locationsUnder85,
  };

  // AR
  const arInvoices = invoicesAR.data ?? [];
  const todayTs = new Date(TODAY).getTime();
  let totalOutstanding = 0;
  let overdue30 = 0;
  let overdue60 = 0;
  let overdue90 = 0;
  arInvoices.forEach((inv: { total_amount: number; due_date: string }) => {
    const amt = Number(inv.total_amount) || 0;
    totalOutstanding += amt;
    const due = new Date(inv.due_date).getTime();
    const daysOver = (todayTs - due) / 864e5;
    if (daysOver > 90) overdue90 += amt;
    else if (daysOver > 60) overdue60 += amt;
    else if (daysOver > 30) overdue30 += amt;
  });
  const ar: ARSnapshot = { totalOutstanding, overdue30, overdue60, overdue90 };

  // Pipeline
  const bids = bidsOpen.data ?? [];
  const proposals = salesProposals.data ?? [];
  const openBids = bids.length;
  const pipelineValue = bids.reduce((s, b) => s + (Number(b.total_estimated_cost) || 0), 0) + proposals.reduce((s, p) => s + (Number(p.proposal_value) || 0), 0);
  const followUpsDueToday = crmActivitiesToday.count ?? 0;
  const won30 = bidsWon30.count ?? 0;
  const lost30 = bidsLost30.count ?? 0;
  const winRate30Pct = won30 + lost30 > 0 ? Math.round((won30 / (won30 + lost30)) * 100) : null;
  const pipeline: PipelineSnapshot = {
    openBids,
    pipelineValue,
    followUpsDueToday,
    winRate30Pct,
  };

  const userName = (profile as { full_name?: string } | null)?.full_name?.split(' ')[0] ?? 'there';

  // Inspections due today: count inspections scheduled/due for today (simplified: use work orders or 0 until we have inspections.due_date)
  const inspectionsDueToday = 0;

  return {
    revenue,
    risk,
    crew,
    accountHealth,
    quality,
    ar,
    pipeline,
    ai: ZERO_AI,
    userName,
    buildingsScheduledToday,
    inspectionsDueToday,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * AR from invoices: outstanding and overdue buckets.
 * Source: invoices where status NOT IN (paid, cancelled, refunded).
 * Use for Financial Health Overview and AR tab so they show real data.
 */
/** Max invoices to aggregate in memory; beyond this use an RPC for exact AR. */
const AR_SNAPSHOT_LIMIT = 10_000;

export async function getARSnapshotForOrg(orgId: string): Promise<ARSnapshotExtended> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('invoices')
    .select('total_amount, due_date')
    .eq('org_id', orgId)
    .not('status', 'in', '("paid","cancelled","refunded")')
    .limit(AR_SNAPSHOT_LIMIT);
  const rows = data ?? [];
  const todayTs = new Date(TODAY).getTime();
  let totalOutstanding = 0;
  let overdue30 = 0;
  let overdue60 = 0;
  let overdue90 = 0;
  let overdueInvoiceCount = 0;
  for (const inv of rows) {
    const amt = Number(inv.total_amount) || 0;
    totalOutstanding += amt;
    const due = new Date(String(inv.due_date ?? '')).getTime();
    const daysOver = (todayTs - due) / 864e5;
    if (daysOver > 0) {
      overdueInvoiceCount += 1;
      if (daysOver > 90) overdue90 += amt;
      else if (daysOver > 60) overdue60 += amt;
      else overdue30 += amt;
    }
  }
  const overdueTotal = overdue30 + overdue60 + overdue90;
  return {
    totalOutstanding,
    overdue30,
    overdue60,
    overdue90,
    overdueTotal,
    overdueInvoiceCount,
  };
}
