/**
 * Role-based layout types. Map existing org_members.role / role_enum to template role key.
 */
export type LayoutMode = 'my' | 'recommended' | 'org_template';

export type { BreakpointKey, LayoutItem } from '@/lib/widgets/types';

/** Normalized role keys for layout templates */
export const TEMPLATE_ROLES = [
  'owner',
  'admin',
  'manager',
  'ops_manager',
  'sales_manager',
  'franchisee',
  'franchise_admin',
  'inspector',
  'cleaner',
  'client_viewer',
] as const;

export type TemplateRoleKey = (typeof TEMPLATE_ROLES)[number];

/**
 * Map org_members.role and role_enum to template role key for layout lookup.
 */
export function toTemplateRole(role: string | null, roleEnum: string | null): TemplateRoleKey {
  const r = (role ?? '').toLowerCase();
  const e = (roleEnum ?? '').toLowerCase();
  if (r === 'owner' || e === 'fr_admin' || e === 'op_admin') return 'owner';
  if (r === 'admin') return 'admin';
  if (r === 'manager') return 'manager';
  if (r === 'ops' || e === 'op_ops_manager' || e === 'op_supervisor') return 'ops_manager';
  if (r === 'sales' || r === 'sales_rep' || e === 'op_sales' || e === 'fr_sales') return 'sales_manager';
  if (e?.startsWith('fr_')) return 'franchise_admin';
  if (r === 'inspector') return 'inspector';
  if (r === 'cleaner') return 'cleaner';
  if (r === 'client_viewer' || r === 'client') return 'client_viewer';
  return 'manager';
}
