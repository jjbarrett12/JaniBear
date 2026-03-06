/**
 * Fetch effective capacity limits for a rep (org settings + per-rep overrides).
 */

import 'server-only';
import { createClient } from '@/lib/supabase/server';

export interface RepCapacityLimits {
  maxNewLeads: number;
  maxWorkingLeads: number;
}

const DEFAULTS: RepCapacityLimits = {
  maxNewLeads: 80,
  maxWorkingLeads: 200,
};

export async function getRepCapacity(
  orgId: string,
  userId: string
): Promise<RepCapacityLimits> {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from('sales_capacity_settings')
    .select('max_new_leads_per_rep, max_working_leads_per_rep')
    .eq('org_id', orgId)
    .maybeSingle();

  const orgMaxNew = settings?.max_new_leads_per_rep ?? DEFAULTS.maxNewLeads;
  const orgMaxWorking = settings?.max_working_leads_per_rep ?? DEFAULTS.maxWorkingLeads;

  const { data: override } = await supabase
    .from('rep_capacity_overrides')
    .select('max_new_leads, max_working_leads')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .eq('active', true)
    .maybeSingle();

  return {
    maxNewLeads: override?.max_new_leads ?? orgMaxNew,
    maxWorkingLeads: override?.max_working_leads ?? orgMaxWorking,
  };
}

/** Batch fetch capacity limits for multiple users (same org). */
export async function getRepCapacityForUsers(
  orgId: string,
  userIds: string[]
): Promise<Map<string, RepCapacityLimits>> {
  if (userIds.length === 0) return new Map();
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from('sales_capacity_settings')
    .select('max_new_leads_per_rep, max_working_leads_per_rep')
    .eq('org_id', orgId)
    .maybeSingle();
  const orgMaxNew = settings?.max_new_leads_per_rep ?? DEFAULTS.maxNewLeads;
  const orgMaxWorking = settings?.max_working_leads_per_rep ?? DEFAULTS.maxWorkingLeads;

  const { data: overrides } = await supabase
    .from('rep_capacity_overrides')
    .select('user_id, max_new_leads, max_working_leads')
    .eq('org_id', orgId)
    .in('user_id', userIds)
    .eq('active', true);

  const overrideByUser = new Map(
    (overrides ?? []).map((o: { user_id: string; max_new_leads?: number | null; max_working_leads?: number | null }) => [
      o.user_id,
      {
        maxNewLeads: o.max_new_leads ?? orgMaxNew,
        maxWorkingLeads: o.max_working_leads ?? orgMaxWorking,
      },
    ])
  );

  const result = new Map<string, RepCapacityLimits>();
  for (const uid of userIds) {
    result.set(uid, overrideByUser.get(uid) ?? { maxNewLeads: orgMaxNew, maxWorkingLeads: orgMaxWorking });
  }
  return result;
}
