import { requireOrg } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { AdminPageLayout } from '@/components/admin/admin-page-layout';
import { AdminRolesContent } from '@/components/admin/admin-roles-content';
import { Skeleton } from '@/components/ui/skeleton';

export default async function AdminRolesPage() {
  await requireOrg();
  const supabase = await createClient();

  const { data: rolePerms } = await supabase
    .from('role_permissions')
    .select('role, permission_key')
    .order('role');

  const byRole = (rolePerms ?? []).reduce<Record<string, string[]>>((acc, row) => {
    const r = row.role ?? '';
    if (!acc[r]) acc[r] = [];
    if (row.permission_key) acc[r].push(row.permission_key);
    return acc;
  }, {});

  return (
    <AdminPageLayout
      title="Roles & Permissions"
      description="Effective access is determined by role. Sensitive permissions are highlighted. Changes require an owner or admin."
    >
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
        <AdminRolesContent rolePermissions={byRole} />
      </div>
    </AdminPageLayout>
  );
}

export function Loading() {
  return (
    <AdminPageLayout title="Roles & Permissions" description="Effective access by role.">
      <Skeleton className="h-96 rounded-2xl" />
    </AdminPageLayout>
  );
}
