import { redirect } from 'next/navigation';
import { requireOrg, getCurrentUserId } from '@/lib/auth';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SalesPageShell } from '@/components/sales/page-shell';
import { PageHeader } from '@/components/sales/page-header';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { isOperationsEnabled } from '@/lib/is-premium';
import { CreateLaunchPacketButton } from '@/components/sales/create-launch-packet-button';

export default async function LaunchPacketsPage() {
  const org = await requireOrg();
  const userId = await getCurrentUserId();
  const operationsEnabled = await isOperationsEnabled(org.org_id, userId);
  if (!operationsEnabled) redirect('/app/sales/win-loss');

  const supabase = await createClient();

  const [packetsRes, allAccountsRes] = await Promise.all([
    supabase
      .from('launch_packets')
      .select('id, account_id, status, created_at, ready_at')
      .eq('org_id', org.org_id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.from('accounts').select('id, name').eq('org_id', org.org_id).order('name').limit(200),
  ]);

  const packets = packetsRes.data ?? [];
  const list = packets as { id: string; account_id: string; status: string; created_at: string; ready_at: string | null }[];
  const accountIds = [...new Set(list.map((p) => p.account_id).filter(Boolean))];
  const { data: accountsForNames } = accountIds.length ? await supabase.from('accounts').select('id, name').in('id', accountIds) : { data: [] };
  const accountName = new Map((accountsForNames ?? []).map((a) => [a.id, a.name]));
  const accountsForCreate = (allAccountsRes.data ?? []).map((a) => ({ id: a.id, name: a.name }));

  const statusLabel = (s: string) =>
    s === 'sent_to_ops' ? 'Submitted' : s === 'ready' ? 'Ready' : s === 'review' ? 'Review' : s.replace(/_/g, ' ');

  return (
    <SalesPageShell
      breadcrumb={
        <span className="text-muted-foreground">
          Sales <span className="text-foreground/80">/ Launch to Operations</span>
        </span>
      }
    >
      <div className="p-4 md:p-6 space-y-6">
        <PageHeader
          title="Launch to Operations"
          description="Ready-for-launch checklist → Submit to Operations. Ops reviews in Launch Intake. Status: Draft → Ready → Submitted."
          primaryCta={<CreateLaunchPacketButton accounts={accountsForCreate} />}
        />
        <Card>
          <CardHeader>
            <CardTitle>Launch packets</CardTitle>
            <p className="text-sm text-muted-foreground">
              Draft → Review → Ready → Submitted. Create from a won opportunity or account.
            </p>
          </CardHeader>
          <CardContent>
            {list.length === 0 ? (
              <p className="text-muted-foreground">No launch packets yet. Create one from a won opportunity or account.</p>
            ) : (
              <ul className="divide-y divide-border">
                {list.map((p) => (
                  <li key={p.id} className="py-3 flex items-center justify-between">
                    <Link href={`/app/sales/launch-packets/${p.id}`} className="font-medium text-primary hover:underline">
                      {accountName.get(p.account_id) ?? p.account_id?.slice(0, 8) ?? p.id.slice(0, 8)}…
                    </Link>
                    <Badge variant="secondary" className="capitalize">{statusLabel(p.status)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </SalesPageShell>
  );
}
