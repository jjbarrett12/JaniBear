/**
 * Recalculate operator_performance and operator_capacity for an org.
 * Used by nightly cron and on-demand. Aggregates from site_health, inspections, account_complaints, crew_assignments.
 * When called from cron, pass admin client to bypass RLS.
 */

import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { calculateTotalScore } from './calculateOperatorScore';
import type { SupabaseClient } from '@supabase/supabase-js';

const QC_DEFAULT = 100;
const RESPONSE_DEFAULT = 100;
const LEADERSHIP_DEFAULT = 100;
const PROXIMITY_DEFAULT = 100;
const COMPLAINT_LOOKBACK_DAYS = 30;

export async function recalculateOperatorScores(
  orgId: string,
  supabaseAdmin?: SupabaseClient
): Promise<void> {
  const supabase = supabaseAdmin ?? (await createClient());

  const crewsRes = await supabase.from('crews').select('id, name').eq('org_id', orgId);
  const crews = (crewsRes.data ?? []) as { id: string; name: string }[];

  for (const crew of crews) {
    const facilityIdsRes = await supabase
      .from('crew_assignments')
      .select('facility_id')
      .eq('crew_id', crew.id);
    const facilityIds = (facilityIdsRes.data ?? []).map((f: { facility_id: string }) => f.facility_id);
    const active_accounts = new Set<string>();
    let totalQc = 0;
    let qcCount = 0;
    let totalMissed = 0;
    let taskDenom = 1;

    for (const fid of facilityIds) {
      const { data: fac } = await supabase.from('facilities').select('account_id').eq('id', fid).single();
      if (fac) active_accounts.add((fac as { account_id: string }).account_id);
      const { data: sh } = await supabase.from('site_health').select('last_inspection_score, missed_shifts_7d').eq('site_id', fid).maybeSingle();
      if (sh) {
        const s = sh as { last_inspection_score?: number | null; missed_shifts_7d?: number };
        if (s.last_inspection_score != null) {
          totalQc += s.last_inspection_score;
          qcCount += 1;
        }
        totalMissed += s.missed_shifts_7d ?? 0;
      }
      taskDenom += 1;
    }
    const qc_score = qcCount > 0 ? totalQc / qcCount : QC_DEFAULT;
    const missed_tasks_rate = taskDenom > 0 ? Math.min(1, totalMissed / (7 * taskDenom)) : 0;

    const since = new Date();
    since.setDate(since.getDate() - COMPLAINT_LOOKBACK_DAYS);
    const { count: complaintCount } = await supabase
      .from('account_complaints')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('operator_type', 'crew')
      .eq('operator_id', crew.id)
      .gte('created_at', since.toISOString());
    const activeCount = active_accounts.size || 1;
    const complaint_rate = complaintCount != null ? complaintCount / activeCount : 0;

    const { data: capRow } = await supabase
      .from('operator_capacity')
      .select('max_accounts, max_sqft, current_sqft')
      .eq('org_id', orgId)
      .eq('operator_type', 'crew')
      .eq('operator_id', crew.id)
      .maybeSingle();
    const max_sqft = (capRow as { max_sqft?: number | null } | null)?.max_sqft ?? null;
    const current_sqft = (capRow as { current_sqft?: number | null } | null)?.current_sqft ?? 0;
    let capacity_score = 100;
    if (max_sqft != null && max_sqft > 0 && current_sqft != null) {
      capacity_score = Math.max(0, Math.min(100, 100 * (1 - current_sqft / max_sqft)));
    }

    const total_score = calculateTotalScore({
      qc_score,
      complaint_rate,
      missed_tasks_rate,
      response_time_score: RESPONSE_DEFAULT,
      leadership_score: LEADERSHIP_DEFAULT,
      capacity_score,
      territory_proximity_score: PROXIMITY_DEFAULT,
    });

    await supabase.from('operator_performance').upsert(
      {
        org_id: orgId,
        operator_type: 'crew',
        operator_id: crew.id,
        qc_score,
        complaint_rate,
        missed_tasks_rate,
        response_time_score: RESPONSE_DEFAULT,
        leadership_score: LEADERSHIP_DEFAULT,
        capacity_score,
        territory_proximity_score: PROXIMITY_DEFAULT,
        total_score,
        score_updated_at: new Date().toISOString(),
      },
      { onConflict: 'org_id,operator_type,operator_id' }
    );

    await supabase.from('operator_capacity').upsert(
      {
        org_id: orgId,
        operator_type: 'crew',
        operator_id: crew.id,
        active_accounts: active_accounts.size,
        max_accounts: (capRow as { max_accounts?: number } | null)?.max_accounts ?? active_accounts.size + 10,
        max_sqft,
        current_sqft,
        growth_capacity: max_sqft != null && max_sqft > 0 ? (100 * (1 - (current_sqft ?? 0) / max_sqft)) : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'org_id,operator_type,operator_id' }
    );
  }

  const { data: franchiseeOrgs } = await supabase
    .from('franchise_associations')
    .select('franchisee_org_id')
    .eq('franchisor_org_id', orgId)
    .eq('status', 'active');
  const franchiseeIds = (franchiseeOrgs ?? []).map((f: { franchisee_org_id: string }) => f.franchisee_org_id);
  for (const fid of franchiseeIds) {
    const total_score = 70;
    const capacity_score = 80;
    await supabase.from('operator_performance').upsert(
      {
        org_id: orgId,
        operator_type: 'franchisee',
        operator_id: fid,
        qc_score: QC_DEFAULT,
        complaint_rate: 0,
        missed_tasks_rate: 0,
        response_time_score: RESPONSE_DEFAULT,
        leadership_score: LEADERSHIP_DEFAULT,
        capacity_score,
        territory_proximity_score: PROXIMITY_DEFAULT,
        total_score,
        score_updated_at: new Date().toISOString(),
      },
      { onConflict: 'org_id,operator_type,operator_id' }
    );
    await supabase.from('operator_capacity').upsert(
      {
        org_id: orgId,
        operator_type: 'franchisee',
        operator_id: fid,
        active_accounts: 0,
        max_accounts: 50,
        max_sqft: null,
        current_sqft: null,
        growth_capacity: 100,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'org_id,operator_type,operator_id' }
    );
  }
}
