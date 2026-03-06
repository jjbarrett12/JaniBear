import 'server-only';
import { createClient } from '@/lib/supabase/server';

export interface VerticalForAdmin {
  id: string;
  key: string;
  label: string;
  active: boolean;
}

export interface SalesRoutingRuleForAdmin {
  id: string;
  name: string;
  priority: number;
  active: boolean;
  territory_id: string | null;
  coverage_area_id: string | null;
  vertical_id: string | null;
  assignee_user_id: string | null;
  assignment_method: string;
  reason: string | null;
}

export interface TerritoryForAdmin {
  id: string;
  name: string;
}

export interface CoverageAreaForAdmin {
  id: string;
  name: string;
}

export interface MemberForAdmin {
  user_id: string;
  display_name: string;
}

export interface SalesCapacitySettingsForAdmin {
  enabled: boolean;
  max_new_leads_per_rep: number;
  max_working_leads_per_rep: number;
  overflow_strategy: string;
  overflow_rep_user_id: string | null;
}

export interface RepCounterForAdmin {
  user_id: string;
  new_count: number;
  working_count: number;
  qualified_count: number;
}

export interface RepOverrideForAdmin {
  user_id: string;
  max_new_leads: number | null;
  max_working_leads: number | null;
}

export interface CoverageAdminData {
  verticals: VerticalForAdmin[];
  rules: SalesRoutingRuleForAdmin[];
  territories: TerritoryForAdmin[];
  coverageAreas: CoverageAreaForAdmin[];
  members: MemberForAdmin[];
  capacitySettings: SalesCapacitySettingsForAdmin | null;
  repCounters: RepCounterForAdmin[];
  repOverrides: RepOverrideForAdmin[];
}

export async function getCoverageAdminData(orgId: string): Promise<CoverageAdminData> {
  const supabase = await createClient();
  const [
    verticalsRes,
    rulesRes,
    territoriesRes,
    areasRes,
    membersRes,
    capacityRes,
    countersRes,
    overridesRes,
  ] = await Promise.all([
    supabase.from('verticals').select('id, key, label, active').eq('org_id', orgId).order('key'),
    supabase.from('sales_routing_rules').select('id, name, priority, active, territory_id, coverage_area_id, vertical_id, assignee_user_id, assignment_method, reason').eq('org_id', orgId).order('priority'),
    supabase.from('territories').select('id, name').eq('org_id', orgId).eq('mode', 'sales').order('name'),
    supabase.from('coverage_areas').select('id, name').eq('org_id', orgId).eq('active', true).order('name'),
    supabase.from('org_members').select('user_id, profiles(full_name)').eq('org_id', orgId),
    supabase.from('sales_capacity_settings').select('enabled, max_new_leads_per_rep, max_working_leads_per_rep, overflow_strategy, overflow_rep_user_id').eq('org_id', orgId).maybeSingle(),
    supabase.from('rep_lead_counters').select('user_id, new_count, working_count, qualified_count').eq('org_id', orgId),
    supabase.from('rep_capacity_overrides').select('user_id, max_new_leads, max_working_leads').eq('org_id', orgId).eq('active', true),
  ]);

  const verticals = (verticalsRes.data ?? []) as VerticalForAdmin[];
  const rules = (rulesRes.data ?? []) as SalesRoutingRuleForAdmin[];
  const territories = (territoriesRes.data ?? []) as TerritoryForAdmin[];
  const coverageAreas = (areasRes.data ?? []) as CoverageAreaForAdmin[];
  const members: MemberForAdmin[] = ((membersRes.data ?? []) as { user_id: string; profiles: { full_name?: string } | null }[]).map((m) => ({
    user_id: m.user_id,
    display_name: m.profiles?.full_name ?? m.user_id,
  }));
  const capacitySettings = capacityRes.data as SalesCapacitySettingsForAdmin | null;
  const repCounters = (countersRes.data ?? []) as RepCounterForAdmin[];
  const repOverrides = (overridesRes.data ?? []) as RepOverrideForAdmin[];

  return { verticals, rules, territories, coverageAreas, members, capacitySettings, repCounters, repOverrides };
}
