/**
 * Server-side aggregation for Operations Command Center.
 * Single entry point: KPIs, coverage gaps, risk accounts, reliability, backup pools.
 */

import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type {
  CommandCenterFilters,
  CommandCenterData,
  CommandCenterKPIs,
  CoverageGapRow,
  RiskAccountRow,
  ReliabilityRow,
  BackupPoolRow,
  BackupPoolMemberRow,
} from './command-center-types';
import { buildRecommendedActions } from './buildRecommendedActions';

const DEFAULT_DATE = () => new Date().toISOString().slice(0, 10);

export async function getCommandCenterData(
  orgId: string,
  filters: CommandCenterFilters = {}
): Promise<CommandCenterData> {
  const supabase = await createClient();
  const date = filters.date ?? DEFAULT_DATE();

  const shiftRows = await fetchShiftCoverage(supabase, orgId, date);
  const facilityIds = [...new Set(shiftRows.map((r) => r.facility_id).filter(Boolean))] as string[];

  const [
    riskRows,
    reliabilityRows,
    poolRows,
    poolMembersRows,
    territories,
    verticals,
    accountNamesMap,
    crewNamesMap,
    facilityMeta,
    operatorPerf,
    complaints7d,
    todayMissedTasks,
    inspectionsAvg,
  ] = await Promise.all([
    fetchRiskSnapshots(supabase, orgId, filters.riskLevel),
    fetchReliability(supabase, orgId),
    supabase.from('backup_pools').select('id, name, territory_id, vertical_id').eq('org_id', orgId),
    fetchPoolMembersWithMeta(supabase, orgId, date),
    supabase.from('territories').select('id, name').eq('org_id', orgId),
    supabase.from('verticals').select('id, key, label').eq('org_id', orgId),
    fetchAccountNames(supabase, orgId),
    fetchCrewNames(supabase, orgId),
    fetchFacilityMeta(supabase, facilityIds),
    supabase.from('operator_performance').select('operator_type, operator_id, total_score, qc_score').eq('org_id', orgId),
    fetchComplaintsLast7(supabase, orgId),
    fetchMissedTasksToday(supabase, orgId),
    fetchAvgQcScore(supabase, orgId),
  ]);

  const territoryNames = new Map((territories.data ?? []).map((t: { id: string; name: string }) => [t.id, t.name]));
  const verticalNames = new Map((verticals.data ?? []).map((v: { id: string; label: string }) => [v.id, v.label]));

  const coverageGaps = buildCoverageGaps(
    shiftRows,
    accountNamesMap,
    territoryNames,
    crewNamesMap,
    filters.territoryId,
    filters.search
  );

  const accountTerritoryIds = filters.territoryId ? await fetchAccountTerritoryIds(supabase, orgId, filters.territoryId) : null;
  const riskAccounts = buildRiskAccounts(
    riskRows,
    accountNamesMap,
    crewNamesMap,
    filters.territoryId,
    accountTerritoryIds,
    filters.search
  );

  const reliabilityAlerts = buildReliabilityList(
    reliabilityRows,
    operatorPerf.data ?? [],
    crewNamesMap,
    filters.search
  );

  const backupPools = buildBackupPools(
    poolRows.data ?? [],
    poolMembersRows,
    operatorPerf.data ?? [],
    territoryNames,
    verticalNames,
    crewNamesMap,
    date,
    filters.territoryId,
    filters.verticalId
  );

  const kpis: CommandCenterKPIs = {
    coverageGapsTonight: coverageGaps.filter((g) => g.coverage_status === 'coverage_needed').length,
    highRiskAccounts: riskAccounts.filter((r) => r.risk_level === 'high' || r.risk_level === 'critical').length,
    reliabilityAlerts: reliabilityAlerts.filter((r) => r.reliability_score < 65).length,
    backupCapacityAvailable: backupPools.reduce((sum, p) => sum + p.available_tonight, 0),
    avgQcScore: inspectionsAvg,
    missedTasksToday: todayMissedTasks,
    complaintsLast7Days: complaints7d,
  };

  const recommendedActions = buildRecommendedActions({
    coverageGaps,
    riskAccounts,
    reliabilityAlerts,
    backupPools,
    kpis,
  });

  const territoriesList = (territories.data ?? []).map((t: { id: string; name: string }) => ({ id: t.id, name: t.name }));
  const verticalsList = (verticals.data ?? []).map((v: { id: string; label: string }) => ({ id: v.id, label: v.label }));

  return {
    kpis,
    coverageGaps,
    riskAccounts,
    reliabilityAlerts,
    backupPools,
    recommendedActions,
    territories: territoriesList,
    verticals: verticalsList,
  };
}

async function fetchShiftCoverage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  date: string
) {
  const { data } = await supabase
    .from('shift_coverage')
    .select('id, account_id, facility_id, shift_date, start_time, end_time, primary_operator_id, backup_operator_id, backup_operator_type, coverage_status')
    .eq('org_id', orgId)
    .eq('shift_date', date)
    .order('start_time');
  return (data ?? []) as Array<{
    id: string;
    account_id: string;
    facility_id: string | null;
    shift_date: string;
    start_time: string;
    end_time: string;
    primary_operator_id: string | null;
    backup_operator_id: string | null;
    backup_operator_type: string | null;
    coverage_status: string;
  }>;
}

async function fetchRiskSnapshots(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  riskLevel?: string | null
) {
  let q = supabase
    .from('account_risk_snapshots')
    .select('id, account_id, operator_type, operator_id, risk_score, risk_level, reasons, status')
    .eq('org_id', orgId)
    .eq('status', 'active');
  if (riskLevel) q = q.eq('risk_level', riskLevel);
  const { data } = await q.order('risk_score', { ascending: false });
  return (data ?? []) as Array<{
    id: string;
    account_id: string;
    operator_type: string;
    operator_id: string;
    risk_score: number;
    risk_level: string;
    reasons: string[];
    status: string;
  }>;
}

async function fetchReliability(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string
) {
  const { data } = await supabase
    .from('crew_reliability_snapshots')
    .select('id, operator_type, operator_id, reliability_score, attendance_score, no_show_rate, late_rate, shift_completion_rate, qc_consistency_score, trend, updated_at')
    .eq('org_id', orgId)
    .order('reliability_score', { ascending: true });
  return (data ?? []) as Array<{
    id: string;
    operator_type: string;
    operator_id: string;
    reliability_score: number;
    attendance_score: number;
    no_show_rate: number;
    late_rate: number;
    shift_completion_rate: number;
    qc_consistency_score: number;
    trend: string;
    updated_at: string;
  }>;
}

async function fetchPoolMembersWithMeta(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  date: string
) {
  const { data: pools } = await supabase.from('backup_pools').select('id').eq('org_id', orgId);
  const poolIds = (pools ?? []).map((p: { id: string }) => p.id);
  if (poolIds.length === 0) return [];
  const { data: members } = await supabase
    .from('backup_pool_members')
    .select('id, pool_id, operator_type, operator_id, max_backup_shifts_per_week')
    .in('pool_id', poolIds);
  const startOfWeek = new Date(date);
  startOfWeek.setDate(startOfWeek.getDate() - new Date(date).getDay());
  const weekStart = startOfWeek.toISOString().slice(0, 10);
  const { data: backupCounts } = await supabase
    .from('shift_coverage')
    .select('backup_operator_type, backup_operator_id')
    .eq('org_id', orgId)
    .eq('coverage_status', 'backup_assigned')
    .gte('shift_date', weekStart)
    .lte('shift_date', date);
  const countByKey = new Map<string, number>();
  for (const r of backupCounts ?? []) {
    const row = r as { backup_operator_type?: string; backup_operator_id?: string };
    if (row.backup_operator_id && row.backup_operator_type) {
      const key = `${row.backup_operator_type}:${row.backup_operator_id}`;
      countByKey.set(key, (countByKey.get(key) ?? 0) + 1);
    }
  }
  return (members ?? []).map((m: { id: string; pool_id: string; operator_type: string; operator_id: string; max_backup_shifts_per_week: number }) => ({
    ...m,
    backup_shifts_this_week: countByKey.get(`${m.operator_type}:${m.operator_id}`) ?? 0,
  }));
}

async function fetchAccountNames(supabase: Awaited<ReturnType<typeof createClient>>, orgId: string) {
  const { data } = await supabase.from('accounts').select('id, name').eq('org_id', orgId);
  const map = new Map<string, string>();
  for (const a of data ?? []) map.set((a as { id: string }).id, (a as { name: string }).name);
  return map;
}

async function fetchFacilityMeta(
  supabase: Awaited<ReturnType<typeof createClient>>,
  facilityIds: string[]
): Promise<Map<string, { name: string; territory_id: string | null }>> {
  const map = new Map<string, { name: string; territory_id: string | null }>();
  if (facilityIds.length === 0) return map;
  const { data } = await supabase.from('facilities').select('id, name, territory_id').in('id', facilityIds);
  for (const f of data ?? []) {
    const row = f as { id: string; name: string; territory_id: string | null };
    map.set(row.id, { name: row.name, territory_id: row.territory_id });
  }
  return map;
}

async function fetchAccountTerritoryIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  territoryId: string
): Promise<Set<string>> {
  const { data } = await supabase
    .from('facilities')
    .select('account_id')
    .eq('org_id', orgId)
    .eq('territory_id', territoryId);
  return new Set((data ?? []).map((r: { account_id: string }) => r.account_id));
}

async function fetchCrewNames(supabase: Awaited<ReturnType<typeof createClient>>, orgId: string) {
  const { data: crews } = await supabase.from('crews').select('id, name').eq('org_id', orgId);
  const map = new Map<string, string>();
  for (const c of crews ?? []) map.set(`crew:${(c as { id: string }).id}`, (c as { name: string }).name);
  const { data: orgs } = await supabase.from('organizations').select('id, name').eq('id', orgId);
  for (const o of orgs ?? []) map.set(`franchisee:${(o as { id: string }).id}`, (o as { name: string }).name);
  return map;
}

async function fetchComplaintsLast7(supabase: Awaited<ReturnType<typeof createClient>>, orgId: string) {
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const { count } = await supabase
    .from('account_complaints')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .gte('created_at', since.toISOString());
  return count ?? 0;
}

async function fetchMissedTasksToday(supabase: Awaited<ReturnType<typeof createClient>>, orgId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const { data: schedules } = await supabase.from('schedules').select('id').eq('org_id', orgId);
  const scheduleIds = (schedules ?? []).map((s: { id: string }) => s.id);
  if (scheduleIds.length === 0) return 0;
  const { count } = await supabase
    .from('task_assignments')
    .select('*', { count: 'exact', head: true })
    .in('schedule_id', scheduleIds)
    .eq('due_date', today);
  return count ?? 0;
}

async function fetchAvgQcScore(supabase: Awaited<ReturnType<typeof createClient>>, orgId: string) {
  const { data } = await supabase
    .from('inspections')
    .select('total_score')
    .eq('org_id', orgId)
    .not('total_score', 'is', null)
    .gte('completed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .limit(500);
  const scores = (data ?? []).map((d: { total_score: number }) => d.total_score).filter((n: number) => typeof n === 'number');
  if (scores.length === 0) return undefined;
  return Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);
}

function buildCoverageGaps(
  rows: Awaited<ReturnType<typeof fetchShiftCoverage>>,
  accountNames: Map<string, string>,
  territoryNames: Map<string, string>,
  crewNames: Map<string, string>,
  territoryId?: string | null,
  search?: string | null
): CoverageGapRow[] {
  const facilityIds = [...new Set(rows.map((r) => r.facility_id).filter(Boolean))] as string[];
  const facilityToTerritory = new Map<string, string>();
  if (facilityIds.length > 0) {
    const { data } = createClient();
    void createClient().then(async (supabase) => {
      const { data: facs } = await supabase.from('facilities').select('id, territory_id').in('id', facilityIds);
      for (const f of facs ?? []) {
        const row = f as { id: string; territory_id: string | null };
        if (row.territory_id) facilityToTerritory.set(row.id, row.territory_id);
      }
    });
  }
  const out: CoverageGapRow[] = [];
  for (const r of rows) {
    const territory_id = r.facility_id ? facilityToTerritory.get(r.facility_id) ?? null : null;
    if (territoryId && territory_id !== territoryId) continue;
    const account_name = accountNames.get(r.account_id) ?? '';
    if (search && !account_name.toLowerCase().includes((search ?? '').toLowerCase())) continue;
    const status = r.coverage_status as CoverageGapRow['coverage_status'];
    out.push({
      id: r.id,
      account_id: r.account_id,
      account_name,
      facility_id: r.facility_id,
      facility_name: meta?.name ?? null,
      territory_id,
      territory_name: territory_id ? territoryNames.get(territory_id) ?? null : null,
      shift_date: '',
      start_time: r.start_time,
      end_time: r.end_time,
      primary_operator_id: r.primary_operator_id,
      primary_operator_name: r.primary_operator_id ? crewNames.get(`crew:${r.primary_operator_id}`) ?? null : null,
      backup_operator_id: r.backup_operator_id,
      backup_operator_name: r.backup_operator_id && r.backup_operator_type
        ? crewNames.get(`${r.backup_operator_type}:${r.backup_operator_id}`) ?? null
        : null,
      coverage_status: status,
      recommended_backup_name: null,
      shift_date: r.shift_date,
    });
  }
  out.sort((a, b) => {
    const statusOrder = { coverage_needed: 0, scheduled: 1, backup_assigned: 2, completed: 3 };
    const sa = statusOrder[a.coverage_status] ?? 4;
    const sb = statusOrder[b.coverage_status] ?? 4;
    if (sa !== sb) return sa - sb;
    return (a.start_time || '').localeCompare(b.start_time || '');
  });
  return out;
}

function buildRiskAccounts(
  rows: Awaited<ReturnType<typeof fetchRiskSnapshots>>,
  accountNames: Map<string, string>,
  crewNames: Map<string, string>,
  territoryId?: string | null,
  accountIdsInTerritory?: Set<string> | null,
  search?: string | null
): RiskAccountRow[] {
  const out: RiskAccountRow[] = [];
  for (const r of rows) {
    if (accountIdsInTerritory && !accountIdsInTerritory.has(r.account_id)) continue;
    const account_name = accountNames.get(r.account_id) ?? '';
    if (search && !account_name.toLowerCase().includes((search ?? '').toLowerCase())) continue;
    out.push({
      id: r.id,
      account_id: r.account_id,
      account_name,
      risk_score: r.risk_score,
      risk_level: r.risk_level as RiskAccountRow['risk_level'],
      top_reason: r.reasons?.[0] ?? null,
      operator_type: r.operator_type,
      operator_id: r.operator_id,
      operator_name: crewNames.get(`${r.operator_type}:${r.operator_id}`) ?? null,
      status: r.status,
      recommended_backup_name: null,
    });
  }
  out.sort((a, b) => {
    const levelOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const la = levelOrder[a.risk_level] ?? 4;
    const lb = levelOrder[b.risk_level] ?? 4;
    if (la !== lb) return la - lb;
    return b.risk_score - a.risk_score;
  });
  return out;
}

function buildReliabilityList(
  reliabilityRows: Awaited<ReturnType<typeof fetchReliability>>,
  operatorPerf: Array<{ operator_type: string; operator_id: string; total_score: number; qc_score?: number }>,
  crewNames: Map<string, string>,
  search?: string | null
): ReliabilityRow[] {
  const perfByKey = new Map<string, { total_score: number; qc_score: number }>();
  for (const p of operatorPerf) {
    perfByKey.set(`${p.operator_type}:${p.operator_id}`, {
      total_score: Number(p.total_score) ?? 0,
      qc_score: Number(p.qc_score) ?? 0,
    });
  }
  const out: ReliabilityRow[] = [];
  if (reliabilityRows.length > 0) {
    for (const r of reliabilityRows) {
      const name = crewNames.get(`${r.operator_type}:${r.operator_id}`) ?? `${r.operator_type}:${r.operator_id}`;
      if (search && !name.toLowerCase().includes((search ?? '').toLowerCase())) continue;
      out.push({
        id: r.id,
        operator_type: r.operator_type as 'crew' | 'franchisee',
        operator_id: r.operator_id,
        operator_name: name,
        reliability_score: r.reliability_score,
        attendance_score: r.attendance_score,
        no_show_rate: Number(r.no_show_rate),
        late_rate: Number(r.late_rate),
        shift_completion_rate: Number(r.shift_completion_rate),
        qc_consistency_score: r.qc_consistency_score,
        trend: r.trend as ReliabilityRow['trend'],
        updated_at: r.updated_at,
      });
    }
  } else {
    for (const p of operatorPerf) {
      const name = crewNames.get(`${p.operator_type}:${p.operator_id}`) ?? `${p.operator_type}:${p.operator_id}`;
      if (search && !name.toLowerCase().includes((search ?? '').toLowerCase())) continue;
      out.push({
        id: `${p.operator_type}:${p.operator_id}`,
        operator_type: p.operator_type as 'crew' | 'franchisee',
        operator_id: p.operator_id,
        operator_name: name,
        reliability_score: Math.round(p.total_score),
        attendance_score: 100,
        no_show_rate: 0,
        late_rate: 0,
        shift_completion_rate: 100,
        qc_consistency_score: Math.round(p.qc_score ?? p.total_score),
        trend: 'flat',
        updated_at: new Date().toISOString(),
      });
    }
    out.sort((a, b) => a.reliability_score - b.reliability_score);
  }
  return out;
}

function buildBackupPools(
  pools: Array<{ id: string; name: string; territory_id: string | null; vertical_id: string | null }>,
  membersWithMeta: Array<{
    id: string;
    pool_id: string;
    operator_type: string;
    operator_id: string;
    max_backup_shifts_per_week: number;
    backup_shifts_this_week: number;
  }>,
  operatorPerf: Array<{ operator_type: string; operator_id: string; total_score: number }>,
  territoryNames: Map<string, string>,
  verticalNames: Map<string, string>,
  crewNames: Map<string, string>,
  date: string,
  territoryId?: string | null,
  verticalId?: string | null
): BackupPoolRow[] {
  const perfByKey = new Map<string, number>();
  for (const p of operatorPerf) perfByKey.set(`${p.operator_type}:${p.operator_id}`, Number(p.total_score) ?? 0);

  const out: BackupPoolRow[] = [];
  for (const pool of pools) {
    if (territoryId && pool.territory_id !== territoryId) continue;
    if (verticalId && pool.vertical_id !== verticalId) continue;
    const members = membersWithMeta.filter((m) => m.pool_id === pool.id);
    const memberRows: BackupPoolMemberRow[] = members.map((m) => ({
      id: m.id,
      operator_type: m.operator_type as 'crew' | 'franchisee',
      operator_id: m.operator_id,
      operator_name: crewNames.get(`${m.operator_type}:${m.operator_id}`) ?? `${m.operator_type}:${m.operator_id}`,
      performance_score: perfByKey.get(`${m.operator_type}:${m.operator_id}`) ?? 0,
      reliability_score: perfByKey.get(`${m.operator_type}:${m.operator_id}`) ?? 0,
      capacity_score: 50,
      backup_shifts_this_week: m.backup_shifts_this_week,
      max_backup_shifts_per_week: m.max_backup_shifts_per_week,
    }));
    const available = memberRows.filter((m) => m.backup_shifts_this_week < m.max_backup_shifts_per_week && m.performance_score >= 70).length;
    const avgScore = memberRows.length > 0
      ? Math.round(memberRows.reduce((s, m) => s + m.performance_score, 0) / memberRows.length)
      : 0;
    let coverage_health: BackupPoolRow['coverage_health'] = 'critical';
    if (available >= 3) coverage_health = 'healthy';
    else if (available >= 1) coverage_health = 'thin';
    out.push({
      id: pool.id,
      name: pool.name,
      territory_id: pool.territory_id,
      territory_name: pool.territory_id ? territoryNames.get(pool.territory_id) ?? null : null,
      vertical_id: pool.vertical_id,
      vertical_name: pool.vertical_id ? verticalNames.get(pool.vertical_id) ?? null : null,
      available_tonight: available,
      avg_backup_score: avgScore,
      coverage_health,
      members: memberRows,
    });
  }
  return out;
}
