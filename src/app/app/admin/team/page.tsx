import { requireOrg } from '@/lib/auth';
import { requirePermission } from '@/lib/authz';
import { PERMISSIONS } from '@/lib/permissions';
import { createClient } from '@/lib/supabase/server';
import { AdminTeamTabs } from './admin-team-tabs';

export const dynamic = 'force-dynamic';

export default async function AdminTeamPage() {
  const org = await requireOrg();
  await requirePermission(PERMISSIONS.ORG_MANAGE_USERS, org.org_id);

  const supabase = await createClient();
  const { data: rolePermissions } = await supabase
    .from('role_permissions')
    .select('role, permission_key')
    .order('role')
    .order('permission_key');

  const byRole = (rolePermissions ?? []).reduce<Record<string, string[]>>((acc, row) => {
    if (!acc[row.role]) acc[row.role] = [];
    acc[row.role].push(row.permission_key);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Team & access</h1>
        <p className="text-muted-foreground mt-1">
          Manage users, invites, roles, and view audit log.
        </p>
      </div>
      <AdminTeamTabs orgId={org.org_id} rolesAndPermissions={byRole} />
    </div>
  );
}
