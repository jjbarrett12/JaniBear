/**
 * Canonical roles (v1) — stored in org_members.role.
 */

export const ROLES = [
  'org.owner',
  'org.admin',
  'sales.manager',
  'sales.rep',
  'ops.manager',
  'ops.crew_lead',
  'ops.crew',
  'client.viewer',
] as const;

export type RoleKey = (typeof ROLES)[number];
