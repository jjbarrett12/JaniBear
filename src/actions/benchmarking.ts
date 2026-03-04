'use server';

import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

/** Settings for benchmarking (opt-in + peer group + optional share code). Only for current user's org. */
export async function getBenchmarkSettings(orgId: string): Promise<{
  benchmarkingOptIn: boolean;
  companySizeBucket: string | null;
  vertical: string | null;
  benchmarkShareCode: string | null;
  error?: string;
}> {
  try {
    const org = await requireOrg();
    if (org.org_id !== orgId) return { benchmarkingOptIn: false, companySizeBucket: null, vertical: null, benchmarkShareCode: null, error: 'Forbidden' };
  } catch {
    return { benchmarkingOptIn: false, companySizeBucket: null, vertical: null, benchmarkShareCode: null, error: 'Unauthorized' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('organizations')
    .select('benchmarking_opt_in, company_size_bucket, vertical, benchmark_share_code')
    .eq('id', orgId)
    .single();

  if (error || !data) {
    return { benchmarkingOptIn: false, companySizeBucket: null, vertical: null, benchmarkShareCode: null, error: error?.message ?? 'Not found' };
  }

  const row = data as { benchmarking_opt_in?: boolean; company_size_bucket?: string | null; vertical?: string | null; benchmark_share_code?: string | null };
  const code = row.benchmark_share_code?.trim() || null;
  return {
    benchmarkingOptIn: Boolean(row.benchmarking_opt_in),
    companySizeBucket: row.company_size_bucket ?? null,
    vertical: row.vertical ?? null,
    benchmarkShareCode: code || null,
  };
}

const ADMIN_ROLES = ['owner', 'admin', 'manager'];

/** Update benchmarking settings. Admin only. */
export async function updateBenchmarkSettings(
  orgId: string,
  payload: {
    benchmarkingOptIn?: boolean;
    companySizeBucket?: string | null;
    vertical?: string | null;
    benchmarkShareCode?: string | null;
  }
): Promise<{ error?: string }> {
  try {
    const org = await requireOrg();
    if (org.org_id !== orgId) return { error: 'Forbidden' };
    const role = (org as { role?: string }).role;
    if (!role || !ADMIN_ROLES.includes(role.toLowerCase())) return { error: 'Only org admins can update benchmarking settings' };
  } catch {
    return { error: 'Unauthorized' };
  }

  const supabase = await createClient();
  const updates: Record<string, unknown> = {};
  if (payload.benchmarkingOptIn !== undefined) updates.benchmarking_opt_in = payload.benchmarkingOptIn;
  if (payload.companySizeBucket !== undefined) updates.company_size_bucket = payload.companySizeBucket || null;
  if (payload.vertical !== undefined) updates.vertical = payload.vertical || null;
  if (payload.benchmarkShareCode !== undefined) updates.benchmark_share_code = payload.benchmarkShareCode?.trim() || null;

  if (Object.keys(updates).length === 0) return {};

  const { error } = await supabase.from('organizations').update(updates).eq('id', orgId);

  if (error) return { error: error.message };
  if (payload.benchmarkShareCode !== undefined) {
    try {
      const { createAdminClient } = await import('@/lib/supabase/admin');
      await createAdminClient().rpc('refresh_benchmark_code_aggregates');
    } catch {
      // Non-fatal; cron will refresh later
    }
  }
  revalidatePath('/app/benchmarks');
  revalidatePath('/app/settings');
  return {};
}

/** Current org's own metrics only (for comparison). No other org's data. */
export async function getOrgBenchmarkMetrics(orgId: string): Promise<{
  closeRate: number | null;
  inspectionScore: number | null;
  grossMargin: number | null;
  costPerSqft: number | null;
  error?: string;
}> {
  try {
    const org = await requireOrg();
    if (org.org_id !== orgId) {
      return { closeRate: null, inspectionScore: null, grossMargin: null, costPerSqft: null, error: 'Forbidden' };
    }
  } catch {
    return { closeRate: null, inspectionScore: null, grossMargin: null, costPerSqft: null, error: 'Unauthorized' };
  }

  const supabase = await createClient();
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  // Close rate: org-level from sales_proposals (delivered vs won in 90d)
  const { data: proposals } = await supabase
    .from('sales_proposals')
    .select('status, delivered_at')
    .eq('org_id', orgId)
    .gte('delivered_at', since);

  let closeRate: number | null = null;
  if (proposals && proposals.length > 0) {
    const delivered = proposals.filter((p) => (p as { delivered_at?: string }).delivered_at).length;
    const won = proposals.filter((p) => (p as { status?: string }).status === 'won').length;
    if (delivered > 0) closeRate = won / delivered;
  }

  // Avg inspection score (90d) - use inspections table
  const { data: insp } = await supabase
    .from('inspections')
    .select('score, total_score, completed_at')
    .eq('org_id', orgId)
    .not('completed_at', 'is', null)
    .gte('completed_at', since);

  let inspectionScore: number | null = null;
  if (insp && insp.length > 0) {
    const scores = insp
      .map((i) => {
        const s = (i as { score?: number | null; total_score?: number | null }).score;
        const t = (i as { total_score?: number | null }).total_score;
        return s != null ? s : t != null ? t : null;
      })
      .filter((v): v is number => v != null);
    if (scores.length > 0) inspectionScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  return {
    closeRate,
    inspectionScore,
    grossMargin: null,
    costPerSqft: null,
  };
}

/** Code-group aggregate for current org (if they have a share code). */
export async function getBenchmarkCodeAggregate(orgId: string): Promise<{
  shareCode: string;
  avgCloseRate: number | null;
  avgInspectionScore: number | null;
  avgGrossMargin: number | null;
  avgCostPerSqft: number | null;
  orgCount: number;
  updatedAt: string;
} | null> {
  try {
    const org = await requireOrg();
    if (org.org_id !== orgId) return null;
  } catch {
    return null;
  }

  const supabase = await createClient();
  const { data: orgRow } = await supabase
    .from('organizations')
    .select('benchmark_share_code')
    .eq('id', orgId)
    .single();
  const code = (orgRow as { benchmark_share_code?: string | null } | null)?.benchmark_share_code?.trim();
  if (!code) return null;

  const { data: row, error } = await supabase
    .from('benchmark_code_aggregates')
    .select('share_code, avg_close_rate, avg_inspection_score, avg_gross_margin, avg_cost_per_sqft, org_count, updated_at')
    .eq('share_code', code)
    .maybeSingle();

  if (error || !row) return null;
  return {
    shareCode: (row as { share_code: string }).share_code,
    avgCloseRate: (row as { avg_close_rate?: number | null }).avg_close_rate ?? null,
    avgInspectionScore: (row as { avg_inspection_score?: number | null }).avg_inspection_score ?? null,
    avgGrossMargin: (row as { avg_gross_margin?: number | null }).avg_gross_margin ?? null,
    avgCostPerSqft: (row as { avg_cost_per_sqft?: number | null }).avg_cost_per_sqft ?? null,
    orgCount: (row as { org_count: number }).org_count ?? 0,
    updatedAt: (row as { updated_at: string }).updated_at,
  };
}

/** Peer aggregates only (public table). No raw org data. */
export async function getBenchmarkAggregates(): Promise<{
  rows: Array<{
    companySizeBucket: string;
    vertical: string;
    avgCloseRate: number | null;
    avgInspectionScore: number | null;
    avgGrossMargin: number | null;
    avgCostPerSqft: number | null;
    orgCount: number;
    updatedAt: string;
  }>;
  error?: string;
}> {
  try {
    await requireOrg();
  } catch {
    return { rows: [], error: 'Unauthorized' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('benchmark_aggregates')
    .select('company_size_bucket, vertical, avg_close_rate, avg_inspection_score, avg_gross_margin, avg_cost_per_sqft, org_count, updated_at')
    .order('company_size_bucket')
    .order('vertical');

  if (error) return { rows: [], error: error.message };

  const rows = (data ?? []).map((r) => ({
    companySizeBucket: (r as { company_size_bucket: string }).company_size_bucket,
    vertical: (r as { vertical: string }).vertical,
    avgCloseRate: (r as { avg_close_rate?: number | null }).avg_close_rate ?? null,
    avgInspectionScore: (r as { avg_inspection_score?: number | null }).avg_inspection_score ?? null,
    avgGrossMargin: (r as { avg_gross_margin?: number | null }).avg_gross_margin ?? null,
    avgCostPerSqft: (r as { avg_cost_per_sqft?: number | null }).avg_cost_per_sqft ?? null,
    orgCount: (r as { org_count: number }).org_count ?? 0,
    updatedAt: (r as { updated_at: string }).updated_at,
  }));

  return { rows };
}
