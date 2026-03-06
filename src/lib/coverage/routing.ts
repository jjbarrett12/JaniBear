/**
 * Coverage routing: compute which coverage area contains a point; pick assignee by rules.
 * Server-only usage when creating/importing leads or assigning accounts.
 */

import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { pointInGeojson } from './point-in-polygon';

export interface CoverageAreaRow {
  id: string;
  org_id: string;
  name: string;
  type: string;
  geojson: { type: string; coordinates?: unknown };
  parent_territory_id: string | null;
  active: boolean;
}

export interface CoverageAssignmentRow {
  id: string;
  coverage_area_id: string;
  assignee_role: string;
  assignee_user_id: string;
  weight: number;
  is_primary: boolean;
}

export interface TerritoryParamsRow {
  routing: { routing?: string; require_coverage?: boolean; assignment?: string };
}

/**
 * Find first territory (sales mode) whose geojson contains the point.
 */
export async function getContainingTerritoryId(
  orgId: string,
  lat: number,
  lng: number
): Promise<string | null> {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from('territories')
    .select('id, geojson')
    .eq('org_id', orgId)
    .eq('mode', 'sales');
  if (error || !rows?.length) return null;
  for (const row of rows as { id: string; geojson: unknown }[]) {
    const gj = row.geojson as { type?: string; coordinates?: unknown };
    if (gj?.type && pointInGeojson(lng, lat, gj)) return row.id;
  }
  return null;
}

/**
 * Find which coverage area (under a parent territory) contains the point.
 * Returns coverage_area_id or null if none.
 */
export async function computeCoverageArea(
  orgId: string,
  lat: number,
  lng: number,
  parentTerritoryId: string | null
): Promise<string | null> {
  const supabase = await createClient();
  let q = supabase
    .from('coverage_areas')
    .select('id, type, geojson')
    .eq('org_id', orgId)
    .eq('active', true);
  if (parentTerritoryId) {
    q = q.eq('parent_territory_id', parentTerritoryId);
  }
  const { data: areas, error } = await q;
  if (error || !areas?.length) return null;
  for (const area of areas as { id: string; type: string; geojson: unknown }[]) {
    const gj = area.geojson as { type: string; coordinates?: unknown };
    if (gj && (area.type === 'polygon' || area.type === 'radius') && pointInGeojson(lng, lat, gj)) {
      return area.id;
    }
  }
  return null;
}

/**
 * Get all assignee user IDs for a coverage area (for capacity filtering).
 */
export async function getCoverageAreaAssignees(
  orgId: string,
  coverageAreaId: string,
  assigneeRole: 'sales_rep' | 'ops_manager' = 'sales_rep'
): Promise<string[]> {
  const supabase = await createClient();
  const { data: assignments, error } = await supabase
    .from('coverage_assignments')
    .select('assignee_user_id')
    .eq('org_id', orgId)
    .eq('coverage_area_id', coverageAreaId)
    .eq('assignee_role', assigneeRole);
  if (error || !assignments?.length) return [];
  return (assignments as { assignee_user_id: string }[]).map((a) => a.assignee_user_id);
}

/**
 * Pick assignee for a coverage area by routing rule.
 * - primary: first assignment with is_primary=true
 * - round_robin: use meta (e.g. last_assignee_index) to rotate
 * - weighted: random by weight (or round_robin for MVP)
 * - manual: return null
 */
export async function pickAssignee(
  orgId: string,
  coverageAreaId: string,
  assigneeRole: 'sales_rep' | 'ops_manager',
  routing: { routing?: string; assignment?: string },
  _roundRobinState?: { lastIndex: number }
): Promise<string | null> {
  const supabase = await createClient();
  const { data: assignments, error } = await supabase
    .from('coverage_assignments')
    .select('assignee_user_id, weight, is_primary')
    .eq('org_id', orgId)
    .eq('coverage_area_id', coverageAreaId)
    .eq('assignee_role', assigneeRole)
    .order('is_primary', { ascending: false });
  if (error || !assignments?.length) return null;

  const rule = (routing.routing ?? routing.assignment ?? 'primary') as string;
  if (rule === 'manual') return null;

  if (rule === 'primary') {
    const primary = (assignments as CoverageAssignmentRow[]).find((a) => a.is_primary);
    return primary?.assignee_user_id ?? (assignments[0] as { assignee_user_id: string }).assignee_user_id;
  }

  if (rule === 'round_robin' && _roundRobinState != null) {
    const idx = _roundRobinState.lastIndex % assignments.length;
    _roundRobinState.lastIndex += 1;
    return (assignments[idx] as { assignee_user_id: string }).assignee_user_id;
  }

  if (rule === 'weighted') {
    const total = (assignments as { weight: number }[]).reduce((s, a) => s + a.weight, 0);
    let r = total > 0 ? Math.random() * total : 0;
    for (const a of assignments as { assignee_user_id: string; weight: number }[]) {
      r -= a.weight;
      if (r <= 0) return a.assignee_user_id;
    }
  }

  return (assignments[0] as { assignee_user_id: string }).assignee_user_id;
}

/**
 * Pick one assignee from an eligible subset (e.g. after capacity filter).
 * Uses same primary/round_robin/weighted logic but only among eligibleUserIds.
 */
export async function pickAssigneeFromEligible(
  orgId: string,
  coverageAreaId: string,
  eligibleUserIds: string[],
  assigneeRole: 'sales_rep' | 'ops_manager',
  routing: { routing?: string; assignment?: string }
): Promise<string | null> {
  if (eligibleUserIds.length === 0) return null;
  const supabase = await createClient();
  const { data: assignments, error } = await supabase
    .from('coverage_assignments')
    .select('assignee_user_id, weight, is_primary')
    .eq('org_id', orgId)
    .eq('coverage_area_id', coverageAreaId)
    .eq('assignee_role', assigneeRole)
    .order('is_primary', { ascending: false });
  if (error || !assignments?.length) return eligibleUserIds[0];
  const eligibleSet = new Set(eligibleUserIds);
  const filtered = (assignments as { assignee_user_id: string; weight: number; is_primary: boolean }[]).filter((a) =>
    eligibleSet.has(a.assignee_user_id)
  );
  if (filtered.length === 0) return eligibleUserIds[0];
  const rule = (routing.routing ?? routing.assignment ?? 'primary') as string;
  if (rule === 'primary') {
    const primary = filtered.find((a) => a.is_primary);
    return primary?.assignee_user_id ?? filtered[0].assignee_user_id;
  }
  if (rule === 'round_robin') {
    const { data: counterRow } = await supabase
      .from('routing_counters')
      .select('counter')
      .eq('org_id', orgId)
      .eq('scope', 'coverage_area')
      .eq('scope_id', coverageAreaId)
      .maybeSingle();
    const c = (counterRow as { counter?: number } | null)?.counter ?? 0;
    const idx = c % filtered.length;
    return filtered[idx].assignee_user_id;
  }
  if (rule === 'weighted') {
    const total = filtered.reduce((s, a) => s + a.weight, 0);
    let r = total > 0 ? Math.random() * total : 0;
    for (const a of filtered) {
      r -= a.weight;
      if (r <= 0) return a.assignee_user_id;
    }
  }

  return filtered[0].assignee_user_id;
}
