import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { requireOrg, getCurrentUserId } from '@/lib/auth';
import { requirePermission } from '@/lib/auth/requirePermission';
import { isAuthzError, isAuthContextError, getAuthContextRedirectPath } from '@/lib/auth/errors';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { RiskDetailClient } from '@/components/ops/RiskDetailClient';

export const dynamic = 'force-dynamic';

export default async function OpsRiskDetailPage({
  params,
}: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const org = await requireOrg();
  const userId = await getCurrentUserId();
  if (!userId) redirect('/auth/login');
  try {
    await requirePermission({ orgId: org.org_id, userId, permission: 'ops.read', pathname: `/app/ops/risk/${accountId}` });
  } catch (e) {
    if (isAuthzError(e)) redirect('/app/forbidden');
    if (isAuthContextError(e)) redirect(getAuthContextRedirectPath(e.code));
    redirect('/app/authz-error');
  }

  const supabase = await createClient();
  const [snapshotRes, accountRes] = await Promise.all([
    supabase
      .from('account_risk_snapshots')
      .select('*')
      .eq('org_id', org.org_id)
      .eq('account_id', accountId)
      .maybeSingle(),
    supabase.from('accounts').select('id, name, status').eq('id', accountId).eq('org_id', org.org_id).single(),
  ]);

  const snapshot = snapshotRes.data as Record<string, unknown> | null;
  const account = accountRes.data as { id: string; name: string; status: string } | null;
  if (!account) notFound();

  const events = (await supabase
    .from('account_risk_events')
    .select('id, action, meta, created_at')
    .eq('org_id', org.org_id)
    .eq('account_id', accountId)
    .order('created_at', { ascending: false })
    .limit(20)).data ?? [];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/app/ops/risk">
          <Button variant="outline" size="icon">←</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Risk: {account.name}</h1>
          <p className="text-muted-foreground mt-1">Account risk snapshot and recommended backups.</p>
        </div>
      </div>

      <RiskDetailClient
        orgId={org.org_id}
        accountId={accountId}
        accountName={account.name}
        snapshot={snapshot}
        events={events as Array<{ id: string; action: string; meta: unknown; created_at: string }>}
      />
    </div>
  );
}
