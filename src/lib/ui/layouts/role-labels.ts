import type { TemplateRoleKey } from './types';

/** Human-readable labels for template roles (used in "Recommended for {label}" badge) */
export const ROLE_DISPLAY_LABELS: Record<TemplateRoleKey, string> = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  ops_manager: 'Ops Manager',
  sales_manager: 'Sales Manager',
  franchisee: 'Franchisee',
  franchise_admin: 'Franchise Admin',
  inspector: 'Inspector',
  cleaner: 'Cleaner',
  client_viewer: 'Client Viewer',
};

export function getRoleDisplayLabel(roleKey: TemplateRoleKey): string {
  return ROLE_DISPLAY_LABELS[roleKey] ?? roleKey;
}
