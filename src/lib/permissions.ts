import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';

export type Role = 'owner' | 'admin' | 'sales' | 'ops' | 'inspector' | 'cleaner' | 'client';

export type Permission = 
  | 'manage_users'
  | 'view_kpis'
  | 'create_proposals'
  | 'run_inspections'
  | 'manage_ops'
  | 'view_client_portal';

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: ['manage_users', 'view_kpis', 'create_proposals', 'run_inspections', 'manage_ops'],
  admin: ['manage_users', 'view_kpis', 'create_proposals', 'run_inspections', 'manage_ops'],
  sales: ['view_kpis', 'create_proposals'],
  ops: ['manage_ops', 'run_inspections'],
  inspector: ['run_inspections'],
  cleaner: [],
  client: ['view_client_portal'],
};

// Map existing roles to new roles if necessary
const LEGACY_ROLE_MAP: Record<string, Role> = {
  'manager': 'admin',
  'client_viewer': 'client',
  'inspector': 'inspector',
  'owner': 'owner'
};

export async function hasPermission(permission: Permission): Promise<boolean> {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return false;

  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!member) return false;
  
  // Normalize role
  let role = member.role as Role;
  if (!ROLE_PERMISSIONS[role] && LEGACY_ROLE_MAP[member.role]) {
    role = LEGACY_ROLE_MAP[member.role];
  }

  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export async function requirePermission(permission: Permission) {
  const allowed = await hasPermission(permission);
  if (!allowed) {
    throw new Error(`Unauthorized: Missing permission ${permission}`);
  }
}
