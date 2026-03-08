/**
 * Canonical authorization: roles, permissions, and bypass rules.
 * See docs/AUTHORIZATION_MODEL.md. Use for server-side checks only.
 */
import 'server-only';
import { GOVERNANCE_PERMISSIONS } from './governance-permissions';

/** Roles that receive full org-scoped permissions (bypass). Independent, Area Franchisor, Unit Franchisee owners + admin. */
export const ORG_OWNER_ROLES = [
  'owner',
  'org.owner',
  'admin',
  'org.admin',
] as const;

export type OrgOwnerRoleKey = (typeof ORG_OWNER_ROLES)[number];

/** Canonical permission keys (governance). Use for requirePermission / hasPermission. */
export const CANONICAL_PERMISSIONS = [...GOVERNANCE_PERMISSIONS] as const;

/** Domains that are org-scoped (owner/admin bypass applies). Platform domain is NOT org-scoped. */
export const ORG_SCOPED_DOMAINS = [
  'sales',
  'launch',
  'ops',
  'crews',
  'quality',
  'org',
  'billing',
  'reports',
  'financials',
  'franchise',
] as const;

/** Permission keys that are org-scoped (owner bypass). Derived from gov_permissions domains. */
const ORG_SCOPED_PERMISSION_PREFIXES = [
  'sales.',
  'launch.',
  'ops.',
  'quality.',
  'org.',
  'billing.',
  'reports.',
  'financials.',
  'franchise.',
] as const;

/**
 * True if the given role is an org owner or admin (full access within org).
 * Case-insensitive. Use to short-circuit permission checks server-side.
 */
export function isOrgOwnerRole(role: string | null | undefined): boolean {
  if (!role || typeof role !== 'string') return false;
  const r = role.trim().toLowerCase();
  return (ORG_OWNER_ROLES as readonly string[]).includes(r);
}

/**
 * True if the permission key is org-scoped (owner/admin get it by bypass).
 * Platform permissions are not granted by owner role.
 */
export function isOrgScopedPermission(permissionKey: string): boolean {
  const k = permissionKey.trim().toLowerCase();
  if (k.startsWith('platform.')) return false;
  return ORG_SCOPED_PERMISSION_PREFIXES.some((p) => k.startsWith(p));
}

/**
 * Legacy permission keys that map to org-scoped (settings, maps, ops, etc.).
 * Used when RPC or role_permissions use legacy keys; owner bypass still applies.
 */
const LEGACY_ORG_SCOPED_PREFIXES = [
  'settings.',
  'org.',
  'maps.',
  'ops.',
  'accounts.',
  'inspection.',
  'task.',
  'issue.',
  'walkthrough.',
  'proposal.',
  'contract.',
  'lead.',
  'dashboard.',
  'coverage.',
  'billing.',
];

export function isLegacyOrgScopedPermission(permissionKey: string): boolean {
  const k = permissionKey.trim().toLowerCase();
  if (k.startsWith('platform.') || k === 'platform.orgs.view' || k === 'platform.orgs.manage') return false;
  return LEGACY_ORG_SCOPED_PREFIXES.some((p) => k.startsWith(p)) || ORG_SCOPED_PERMISSION_PREFIXES.some((p) => k.startsWith(p));
}

/**
 * True if the permission should be granted when user is org owner.
 * (Org-scoped governance key or legacy org-scoped key.)
 */
export function isGrantedToOrgOwner(permissionKey: string): boolean {
  return isOrgScopedPermission(permissionKey) || isLegacyOrgScopedPermission(permissionKey);
}
