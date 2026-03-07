/**
 * Canonical operational site resolution for launch and ops.
 * Model: account = commercial customer, facility = operational service location.
 * Prefer facility_id; location_id is legacy and deprecated for operational flows.
 */

/** Record that may have facility_id and/or legacy location_id */
export type WithOperationalSite = {
  facility_id?: string | null;
  location_id?: string | null;
};

/**
 * Returns the operational site id for queries (crew_assignments, schedules, inspections, issues).
 * Prefer facility_id; fall back to location_id for backward compatibility.
 * Use this when building .or(`location_id.eq.${id},facility_id.eq.${id}`) or for single-id lookups.
 */
export function getOperationalSiteId(record: WithOperationalSite | null | undefined): string | null {
  if (!record) return null;
  if (record.facility_id != null && record.facility_id !== '') return record.facility_id;
  if (record.location_id != null && record.location_id !== '') return record.location_id;
  return null;
}

/**
 * True if the record has a facility (preferred) or legacy location for ops handoff.
 */
export function hasOperationalSite(record: WithOperationalSite | null | undefined): boolean {
  return getOperationalSiteId(record) != null;
}

/**
 * For readiness/validation messages: say "facility or location" so UI stays clear during transition.
 */
export const OPERATIONAL_SITE_LABEL = 'facility or location';
