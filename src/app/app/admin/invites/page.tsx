import { requireOrg } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminPageLayout } from '@/components/admin/admin-page-layout';
import { AdminInvitesClient } from '@/components/admin/admin-invites-client';
import { Skeleton } from '@/components/ui/skeleton';

export default async function AdminInvitesPage() {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: invites } = await supabase
    .from('org_invites')
    .select('id, email, role, created_at, expires_at, accepted_at')
    .eq('org_id', org.org_id)
    .order('created_at', { ascending: false });

  const rows = (invites ?? []).map((i) => ({
    id: i.id,
    email: i.email,
    role: i.role ?? '—',
    created_at: i.created_at ?? null,
    expires_at: i.expires_at ?? null,
    accepted_at: i.accepted_at ?? null,
    status: i.accepted_at ? 'accepted' : new Date(i.expires_at ?? 0) < new Date() ? 'expired' : 'pending',
  }));

  return (
    <AdminPageLayout
      title="Invites"
      description="Invite team members by email. They’ll receive a link to join your organization."
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
          <p className="text-sm text-muted-foreground mb-4">
            Invites expire in 7 days. Recipients can use the link in the email to join the organization.
          </p>
          <AdminInvitesClient initialInvites={rows} />
        </div>
      </div>
    </AdminPageLayout>
  );
}

export function Loading() {
  return (
    <AdminPageLayout title="Invites" description="Invite team members by email.">
      <Skeleton className="h-96 rounded-2xl" />
    </AdminPageLayout>
  );
}
