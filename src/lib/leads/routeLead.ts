/**
 * Lead routing: vertical rules first, then coverage area, then territory.
 * Respects capacity limits (rep_lead_counters) and overflow strategy.
 */

import 'server-only';
import { createClient } from '@/lib/supabase/server';
import {
  getContainingTerritoryId,
  computeCoverageArea,
  pickAssignee,
  getCoverageAreaAssignees,
  pickAssigneeFromEligible,
} from '@/lib/coverage/routing';
import { filterCandidatesByCapacity } from './capacity/isRepAtCapacity';
import { updateRepLeadCounters } from './capacity/updateRepLeadCounters';

export interface LeadForRouting {
  id: string;
  org_id: string;
  company?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  vertical_id?: string | null;
  territory_id?: string | null;
  coverage_area_id?: string | null;
  assigned_user_id?: string | null;
}

export interface RouteLeadResult {
  assigned_user_id: string | null;
  territory_id: string | null;
  coverage_area_id: string | null;
  source: 'vertical_rule' | 'coverage_area' | 'territory' | 'overflow_rep' | 'manual';
  rule_id?: string | null;
  reason?: string | null;
  overflow?: boolean;
  overflow_reason?: string | null;
  routed_by?: string | null;
}

const DEFAULT_ROUTING_ORDER = ['vertical_rules', 'coverage_area', 'territory', 'manual'] as const;

type CapacitySettings = {
  enabled: boolean;
  overflow_strategy: 'next_rep' | 'overflow_rep' | 'unassigned_queue';
  overflow_rep_user_id: string | null;
};

function arrayIncludes(arr: string[] | null | undefined, value: string | null | undefined): boolean {
  if (!arr?.length) return true;
  if (value == null || value === '') return false;
  const v = value.toLowerCase();
  return arr.some((k) => v.includes(k.toLowerCase()));
}

function arrayContainsValue(arr: string[] | null | undefined, value: string | null | undefined): boolean {
  if (!arr?.length) return true;
  if (value == null || value === '') return false;
  const v = value.toLowerCase();
  return arr.some((k) => k.toLowerCase() === v);
}

/** Returns true if lead matches all non-null criteria of the rule. */
function leadMatchesRule(
  lead: LeadForRouting,
  rule: {
    territory_id?: string | null;
    coverage_area_id?: string | null;
    vertical_id?: string | null;
    company_keyword_includes?: string[] | null;
    website_keyword_includes?: string[] | null;
    city_includes?: string[] | null;
    state_includes?: string[] | null;
  },
  territoryId: string | null,
  coverageAreaId: string | null
): boolean {
  if (rule.territory_id != null && rule.territory_id !== territoryId) return false;
  if (rule.coverage_area_id != null && rule.coverage_area_id !== coverageAreaId) return false;
  if (rule.vertical_id != null && rule.vertical_id !== lead.vertical_id) return false;
  if (rule.company_keyword_includes?.length && !arrayIncludes(rule.company_keyword_includes, lead.company)) return false;
  if (rule.city_includes?.length && !arrayContainsValue(rule.city_includes, lead.city)) return false;
  if (rule.state_includes?.length && !arrayContainsValue(rule.state_includes, lead.state)) return false;
  return true;
}

async function loadCapacitySettings(orgId: string): Promise<CapacitySettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('sales_capacity_settings')
    .select('enabled, overflow_strategy, overflow_rep_user_id')
    .eq('org_id', orgId)
    .maybeSingle();
  return {
    enabled: (data as { enabled?: boolean } | null)?.enabled ?? false,
    overflow_strategy: ((data as { overflow_strategy?: string } | null)?.overflow_strategy as CapacitySettings['overflow_strategy']) ?? 'next_rep',
    overflow_rep_user_id: (data as { overflow_rep_user_id?: string | null } | null)?.overflow_rep_user_id ?? null,
  };
}

async function applyOverflow(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  leadId: string,
  territoryId: string | null,
  coverageAreaId: string | null,
  capacity: CapacitySettings,
  reason: 'capacity_max_new' | 'capacity_max_working' | 'no_eligible_rep'
): Promise<RouteLeadResult> {
  const assignee =
    capacity.overflow_strategy === 'overflow_rep' && capacity.overflow_rep_user_id
      ? capacity.overflow_rep_user_id
      : null;
  await supabase
    .from('leads')
    .update({
      territory_id: territoryId,
      coverage_area_id: coverageAreaId,
      assigned_user_id: assignee,
      overflow: true,
      overflow_reason: reason,
      routed_by: 'manual',
      updated_at: new Date().toISOString(),
    })
    .eq('id', leadId)
    .eq('org_id', orgId);
  await supabase.from('lead_events').insert({
    org_id: orgId,
    lead_id: leadId,
    action: 'routed',
    meta: { overflow: true, overflowReason: reason, chosenUserId: assignee, source: 'overflow' },
  });
  if (assignee) {
    await updateRepLeadCounters(orgId, {
      prevAssigneeId: null,
      newAssigneeId: assignee,
      prevStatus: null,
      newStatus: 'new',
    });
  }
  return {
    assigned_user_id: assignee,
    territory_id: territoryId,
    coverage_area_id: coverageAreaId,
    source: assignee ? 'overflow_rep' : 'manual',
    overflow: true,
    overflow_reason: reason,
    routed_by: 'manual',
  };
}

async function assignLead(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  leadId: string,
  userId: string,
  territoryId: string | null,
  coverageAreaId: string | null,
  source: RouteLeadResult['source'],
  meta: Record<string, unknown>
): Promise<void> {
  await supabase
    .from('leads')
    .update({
      territory_id: territoryId,
      coverage_area_id: coverageAreaId,
      assigned_user_id: userId,
      overflow: false,
      overflow_reason: null,
      routed_by: source,
      updated_at: new Date().toISOString(),
    })
    .eq('id', leadId)
    .eq('org_id', orgId);
  await supabase.from('lead_events').insert({
    org_id: orgId,
    lead_id: leadId,
    action: 'routed',
    meta: { ...meta, chosenUserId: userId, source },
  });
  await updateRepLeadCounters(orgId, {
    prevAssigneeId: null,
    newAssigneeId: userId,
    prevStatus: null,
    newStatus: 'new',
  });
}

/**
 * Route a lead: assign territory_id, coverage_area_id, assigned_user_id by routing_order.
 * Respects rep capacity (rep_lead_counters); applies overflow strategy when no eligible rep.
 */
export async function routeLead(
  lead: LeadForRouting,
  lat: number | null,
  lng: number | null
): Promise<RouteLeadResult> {
  const supabase = await createClient();
  const orgId = lead.org_id;
  const capacity = await loadCapacitySettings(orgId);

  let territoryId: string | null = lead.territory_id ?? null;
  let coverageAreaId: string | null = lead.coverage_area_id ?? null;

  if ((lat != null && lng != null) && (territoryId == null || coverageAreaId == null)) {
    if (territoryId == null) territoryId = await getContainingTerritoryId(orgId, lat, lng);
    coverageAreaId = await computeCoverageArea(orgId, lat, lng, territoryId);
  }

  const routingOrder: string[] = DEFAULT_ROUTING_ORDER as unknown as string[];
  const { data: paramRows } = await supabase
    .from('territory_parameters')
    .select('routing')
    .eq('org_id', orgId)
    .eq('mode', 'sales')
    .limit(1);
  const routingJson = (paramRows?.[0] as { routing?: { routing_order?: string[] } } | undefined)?.routing;
  if (Array.isArray(routingJson?.routing_order) && routingJson.routing_order.length) {
    routingOrder.length = 0;
    routingOrder.push(...routingJson.routing_order);
  }
  const params = routingJson as { routing?: string; assignment?: string } | undefined;

  for (const step of routingOrder) {
    if (step === 'vertical_rules') {
      const { data: rules } = await supabase
        .from('sales_routing_rules')
        .select('id, territory_id, coverage_area_id, vertical_id, company_keyword_includes, city_includes, state_includes, assignee_user_id, assignment_method, reason')
        .eq('org_id', orgId)
        .eq('active', true)
        .order('priority', { ascending: true });
      const list = (rules ?? []) as {
        id: string;
        territory_id: string | null;
        coverage_area_id: string | null;
        vertical_id: string | null;
        assignee_user_id: string | null;
        reason: string | null;
      }[];
      for (const rule of list) {
        if (!leadMatchesRule(lead, rule, territoryId, coverageAreaId)) continue;
        const candidate = rule.assignee_user_id;
        if (!candidate) break;
        const candidates = [candidate];
        let eligible = candidates;
        if (capacity.enabled) {
          const filtered = await filterCandidatesByCapacity(orgId, candidates);
          eligible = filtered.eligible;
        }
        const candidateCount = candidates.length;
        const eligibleCount = eligible.length;
        let userId: string | null = eligible.length > 0 ? eligible[0] : null;
        if (userId) {
          await assignLead(supabase, orgId, lead.id, userId, territoryId, coverageAreaId, 'vertical_rule', {
            rule_id: rule.id,
            reason: rule.reason,
            vertical_id: lead.vertical_id,
            candidateCount,
            eligibleCount,
          });
          return {
            assigned_user_id: userId,
            territory_id: territoryId,
            coverage_area_id: coverageAreaId,
            source: 'vertical_rule',
            rule_id: rule.id,
            reason: rule.reason,
          };
        }
        if (capacity.enabled && candidateCount > 0) {
          return applyOverflow(
            supabase,
            orgId,
            lead.id,
            territoryId,
            coverageAreaId,
            capacity,
            eligibleCount === 0 ? 'capacity_max_new' : 'no_eligible_rep'
          );
        }
        break;
      }
    }

    if (step === 'coverage_area' && coverageAreaId) {
      const candidates = await getCoverageAreaAssignees(orgId, coverageAreaId, 'sales_rep');
      if (candidates.length === 0) continue;
      let eligible = candidates;
      if (capacity.enabled) {
        const filtered = await filterCandidatesByCapacity(orgId, candidates);
        eligible = filtered.eligible;
      }
      const candidateCount = candidates.length;
      const eligibleCount = eligible.length;
      const userId =
        eligible.length > 0
          ? await pickAssigneeFromEligible(orgId, coverageAreaId, eligible, 'sales_rep', params ?? {})
          : capacity.enabled
            ? null
            : await pickAssignee(orgId, coverageAreaId, 'sales_rep', params ?? {});
      if (userId) {
        await assignLead(supabase, orgId, lead.id, userId, territoryId, coverageAreaId, 'coverage_area', {
          territory_id: territoryId,
          coverage_area_id: coverageAreaId,
          candidateCount,
          eligibleCount,
        });
        return {
          assigned_user_id: userId,
          territory_id: territoryId,
          coverage_area_id: coverageAreaId,
          source: 'coverage_area',
        };
      }
      if (capacity.enabled && candidateCount > 0) {
        return applyOverflow(
          supabase,
          orgId,
          lead.id,
          territoryId,
          coverageAreaId,
          capacity,
          eligibleCount === 0 ? 'capacity_max_new' : 'no_eligible_rep'
        );
      }
    }

    if (step === 'territory' && territoryId) {
      const { data: def } = await supabase
        .from('territory_parameters')
        .select('routing')
        .eq('org_id', orgId)
        .eq('territory_id', territoryId)
        .eq('mode', 'sales')
        .maybeSingle();
      const defaultAssignee = (def as { routing?: { default_assignee_id?: string } } | null)?.routing?.default_assignee_id;
      if (defaultAssignee) {
        const candidates = [defaultAssignee];
        let eligible = candidates;
        if (capacity.enabled) {
          const filtered = await filterCandidatesByCapacity(orgId, candidates);
          eligible = filtered.eligible;
        }
        const candidateCount = 1;
        const eligibleCount = eligible.length;
        const userId = eligible.length > 0 ? eligible[0] : null;
        if (userId) {
          await assignLead(supabase, orgId, lead.id, userId, territoryId, coverageAreaId, 'territory', {
            territory_id: territoryId,
            candidateCount,
            eligibleCount,
          });
          return {
            assigned_user_id: userId,
            territory_id: territoryId,
            coverage_area_id: coverageAreaId,
            source: 'territory',
          };
        }
        if (capacity.enabled) {
          return applyOverflow(
            supabase,
            orgId,
            lead.id,
            territoryId,
            coverageAreaId,
            capacity,
            eligibleCount === 0 ? 'capacity_max_new' : 'no_eligible_rep'
          );
        }
      }
    }

    if (step === 'manual') break;
  }

  await supabase
    .from('leads')
    .update({
      territory_id: territoryId,
      coverage_area_id: coverageAreaId,
      overflow: false,
      overflow_reason: null,
      routed_by: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', lead.id)
    .eq('org_id', orgId);

  return {
    assigned_user_id: null,
    territory_id: territoryId,
    coverage_area_id: coverageAreaId,
    source: 'manual',
  };
}
