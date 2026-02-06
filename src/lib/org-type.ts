/**
 * JaniBear OS: Org type helpers for joint-employer separation.
 * See JANIBEAR_OS_SYSTEM.md. Use these to gate labor-control and worker-data features.
 */

export type OrgType = 'operator' | 'franchisor';

export function isOperatorOrg(orgType: OrgType | null | undefined): boolean {
  return orgType === 'operator';
}

export function isFranchisorOrg(orgType: OrgType | null | undefined): boolean {
  return orgType === 'franchisor';
}

/** Franchisors may only see outcomes/aggregates; never labor, PII, or real-time execution. */
export function canSeeLaborData(orgType: OrgType | null | undefined): boolean {
  return orgType === 'operator';
}

/** Use in franchisor-facing UI: recommended/optional language only. */
export const FRANCHISOR_COPY_PREFIX = 'Suggested'; // e.g. "Suggested Standard", "Recommended"
