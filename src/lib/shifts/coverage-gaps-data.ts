/**
 * Load coverage gaps (shift_coverage where coverage_status = 'coverage_needed')
 * for today/tonight for Ops dashboard and map.
 */

import 'server-only';
import { createClient } from '@/lib/supabase/server';

export interface CoverageGapRow {
  id: string;
  account_id: string;
  account_name: string;
  facility_id: string | null;
  facility_name: string | null;
  shift_date: string;
  start_time: string;
  end_time: string;
  primary_operator_id: string | null;
  latitude: number | null;
  longitude: number | null;
}

export async function getCoverageGapsForDate(
  orgId: string,
  date: string
): Promise<CoverageGapRow[]> {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from('shift_coverage')
    .select('id, account_id, facility_id, shift_date, start_time, end_time, primary_operator_id')
    .eq('org_id', orgId)
    .eq('shift_date', date)
    .eq('coverage_status', 'coverage_needed')
    .order('start_time');

  const list = (rows ?? []) as Array<{
    id: string;
    account_id: string;
    facility_id: string | null;
    shift_date: string;
    start_time: string;
    end_time: string;
    primary_operator_id: string | null;
  }>;

  const accountIds = [...new Set(list.map((r) => r.account_id))];
  const facilityIds = [...new Set(list.map((r) => r.facility_id).filter(Boolean))] as string[];

  const accountNames = new Map<string, string>();
  const facilityMeta = new Map<string, { name: string; latitude: number; longitude: number }>();

  if (accountIds.length > 0) {
    const { data: accounts } = await supabase.from('accounts').select('id, name').in('id', accountIds);
    for (const a of accounts ?? []) accountNames.set((a as { id: string; name: string }).id, (a as { name: string }).name);
  }
  if (facilityIds.length > 0) {
    const { data: facilities } = await supabase
      .from('facilities')
      .select('id, name, latitude, longitude')
      .in('id', facilityIds);
    for (const f of facilities ?? []) {
      const row = f as { id: string; name: string; latitude: number | null; longitude: number | null };
      facilityMeta.set(row.id, {
        name: row.name,
        latitude: row.latitude ?? 0,
        longitude: row.longitude ?? 0,
      });
    }
  }

  return list.map((r) => ({
    id: r.id,
    account_id: r.account_id,
    account_name: accountNames.get(r.account_id) ?? '',
    facility_id: r.facility_id,
    facility_name: r.facility_id ? facilityMeta.get(r.facility_id)?.name ?? null : null,
    shift_date: r.shift_date,
    start_time: r.start_time,
    end_time: r.end_time,
    primary_operator_id: r.primary_operator_id,
    latitude: r.facility_id ? facilityMeta.get(r.facility_id)?.latitude ?? null : null,
    longitude: r.facility_id ? facilityMeta.get(r.facility_id)?.longitude ?? null : null,
  }));
}
