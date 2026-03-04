/**
 * RBAC permission keys — single source of truth for permission checks.
 * Must match role_permissions table in DB; enforcement is server/db.
 */

export const PERMISSIONS = {
  ORG_MANAGE_USERS: 'org.manage_users',
  ORG_MANAGE_SETTINGS: 'org.manage_settings',
  BILLING_MANAGE: 'billing.manage',
  DASHBOARD_MANAGEMENT_VIEW: 'dashboard.management.view',
  DASHBOARD_OPS_VIEW: 'dashboard.ops.view',
  DASHBOARD_SALES_VIEW: 'dashboard.sales.view',
  TASKS_MANAGE: 'tasks.manage',
  TASKS_COMPLETE: 'tasks.complete',
  INSPECTIONS_VIEW: 'inspections.view',
  INSPECTIONS_CREATE: 'inspections.create',
  REPORTS_VIEW: 'reports.view',
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** Roles that can manage users and invites (for Admin UI gating). */
export const ROLES_WITH_MANAGE_USERS: string[] = ['owner', 'admin'];

/** Roles that can view management dashboard. */
export const ROLES_WITH_MANAGEMENT_VIEW: string[] = ['owner', 'admin', 'manager'];
