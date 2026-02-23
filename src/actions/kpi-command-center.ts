'use server';

import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import type { KpiSummaryRow } from '@/lib/kpi-command-center';

/**
 * Fetch KPI summary for current org (one row from kpi_summary_view).
 * All queries org-scoped. Replace with real aggregates when backend supports.
 */
export async function getKpiSummary(orgId: string): Promise<KpiSummaryRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('kpi_summary_view')
    .select('*')
    .eq('org_id', orgId)
    .maybeSingle();

  if (error) return null;
  return data as KpiSummaryRow | null;
}
