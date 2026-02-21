import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/enterprise';
import { StatusPill, type OrgStatus } from '@/components/platform/status-pill';
import { ImpersonateButton } from '@/components/platform/impersonate-button';
import { ShellSelector } from '@/components/platform/shell-selector';
import { Building2, Users, LayoutDashboard } from 'lucide-react';
import type { ShellKey } from '@/lib/shell';

export default async function PlatformOrgDetailPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, status, plan, created_at, shell')
    .eq('id', orgId)
    .single();

  if (!org) notFound();
  const currentShell = (org.shell as ShellKey) ?? 'owner_operator';

  const { data: members } = await supabase
    .from('org_members')
    .select('user_id, role, status')
    .eq('org_id', orgId);

  const status = (org.status as OrgStatus) || 'active';
  const created = org.created_at ? new Date(org.created_at).toLocaleDateString() : '—';

  return (
    <>
      <PageHeader
        breadcrumb={<Link href="/platform/orgs" className="text-muted-foreground hover:text-foreground">Orgs</Link>}
        title={org.name ?? 'Org'}
        badge={<StatusPill status={status} />}
        description={`Created ${created} · Plan ${org.plan ?? '—'}`}
        actions={<ImpersonateButton orgId={orgId} orgName={org.name ?? 'Org'} />}
      />

      <div className="mt-6 flex gap-4 border-b border-border pb-4">
        {['Overview', 'Users', 'AI Settings', 'Pro Gear visibility', 'Activity'].map((tab) => (
          <button
            key={tab}
            type="button"
            className="text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent pb-2 -mb-0.5"
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 mt-6">
        <Card className="rounded-2xl border border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold tracking-tight flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">ID</span> {org.id}</p>
            <p><span className="text-muted-foreground">Status</span> {org.status ?? '—'}</p>
            <p><span className="text-muted-foreground">Plan</span> {org.plan ?? '—'}</p>
            <p><span className="text-muted-foreground">Shell</span> {currentShell}</p>
            <p><span className="text-muted-foreground">Created</span> {created}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold tracking-tight flex items-center gap-2">
              <Users className="h-4 w-4" /> Members ({members?.length ?? 0})
            </CardTitle>
            <CardDescription>Org members for this tenant</CardDescription>
          </CardHeader>
          <CardContent>
            {!members?.length ? (
              <p className="text-muted-foreground text-sm">No members.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {members.map((m) => (
                  <li key={m.user_id}>
                    <span className="font-mono text-muted-foreground">{m.user_id.slice(0, 8)}…</span>
                    <span className="ml-2">{m.role}</span>
                    {m.status ? <span className="ml-2 text-muted-foreground">({m.status})</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 rounded-2xl border border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold tracking-tight flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" /> Dashboard experience (verification)
          </CardTitle>
          <CardDescription>Switch shell — same 3 options. Persists to DB and drives nav + route access.</CardDescription>
        </CardHeader>
        <CardContent>
          <ShellSelector orgId={orgId} currentShell={currentShell} />
        </CardContent>
      </Card>
    </>
  );
}
