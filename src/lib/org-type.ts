/**
 * JANIBEAR OS: Org type helpers for joint-employer separation.
 * See JANIBEAR_OS_SYSTEM.md. Use these to gate labor-control and worker-data features.
 * DB uses franchisor | franchisee | independent; franchisee + independent = operator.
 */

export type OrgType = 'franchisor' | 'franchisee' | 'independent';

/** Operator = franchisee or independent (controls labor). */
export function isOperatorOrg(orgType: string | null | undefined): boolean {
  return orgType === 'franchisee' || orgType === 'independent';
}

export function isFranchisorOrg(orgType: string | null | undefined): boolean {
  return orgType === 'franchisor';
}

/** Franchisors may only see outcomes/aggregates; never labor, PII, or real-time execution. */
export function canSeeLaborData(orgType: string | null | undefined): boolean {
  return isOperatorOrg(orgType);
}

/** Use in franchisor-facing UI: recommended/optional language only. */
export const FRANCHISOR_COPY_PREFIX = 'Suggested'; // e.g. "Suggested Standard", "Recommended"
