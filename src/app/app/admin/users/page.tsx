import { requireOrg, getCurrentUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminPageLayout } from '@/components/admin/admin-page-layout';
import { AdminUsersTable } from '@/components/admin/admin-users-table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { updateMemberRole, removeMember } from '@/actions/team';

export default async function AdminUsersPage() {
  const org = await requireOrg();
  const userId = await getCurrentUserId();
  if (!userId) redirect('/auth/login');

  const supabase = await createClient();
  const { data: members } = await supabase
    .from('org_members')
    .select('id, user_id, role, status, created_at, profiles(full_name)')
    .eq('org_id', org.org_id)
    .order('created_at', { ascending: false });

  const rows = (members ?? []).map((m) => ({
    id: m.id,
    user_id: m.user_id,
    role: m.role ?? '—',
    status: (m.status ?? 'active') as 'active' | 'invited' | 'suspended' | 'deactivated',
    created_at: m.created_at ?? null,
    profiles: m.profiles as { full_name?: string } | null,
  }));

  return (
    <AdminPageLayout
      title="Users"
      description="Manage team members, roles, and access. Changes are logged in the audit log."
      actions={
        <Button asChild size="sm" className="rounded-lg">
          <Link href="/app/admin/invites">
            <UserPlus className="mr-2 h-4 w-4" />
            Invite
          </Link>
        </Button>
      }
    >
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
        <AdminUsersTable
          members={rows}
          currentUserId={userId}
          updateMemberRole={updateMemberRole}
          removeMember={removeMember}
        />
      </div>
    </AdminPageLayout>
  );
}

export function Loading() {
  return (
    <AdminPageLayout title="Users" description="Manage team members, roles, and access.">
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden">
        <div className="p-6 space-y-4">
          <Skeleton className="h-10 w-full max-w-sm" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </AdminPageLayout>
  );
}
