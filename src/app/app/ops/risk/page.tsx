import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireOrg, getCurrentUserId } from '@/lib/auth';
import { requirePermission } from '@/lib/auth/requirePermission';
import { isAuthzError, isAuthContextError, getAuthContextRedirectPath } from '@/lib/auth/errors';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function OpsRiskListPage() {
  const org = await requireOrg();
  const userId = await getCurrentUserId();
  if (!userId) redirect('/auth/login');
  try {
    await requirePermission({ orgId: org.org_id, userId, permission: 'ops.read', pathname: '/app/ops/risk' });
  } catch (e) {
    if (isAuthzError(e)) redirect('/app/forbidden');
    if (isAuthContextError(e)) redirect(getAuthContextRedirectPath(e.code));
    redirect('/app/authz-error');
  }

  const supabase = await createClient();
  const { data: snapshots } = await supabase
    .from('account_risk_snapshots')
    .select('id, account_id, operator_type, operator_id, risk_score, risk_level, reasons, status, updated_at')
    .eq('org_id', org.org_id)
    .eq('status', 'active')
    .order('risk_score', { ascending: false });

  const list = (snapshots ?? []) as Array<{
    id: string;
    account_id: string;
    operator_type: string;
    operator_id: string;
    risk_score: number;
    risk_level: string;
    reasons: string[];
    status: string;
    updated_at: string;
  }>;

  const accountIds = [...new Set(list.map((s) => s.account_id))];
  const accountNames = new Map<string, string>();
  if (accountIds.length > 0) {
    const { data: accounts } = await supabase.from('accounts').select('id, name').in('id', accountIds);
    for (const a of accounts ?? []) accountNames.set((a as { id: string; name: string }).id, (a as { name: string }).name);
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/app/ops">
          <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Accounts at Risk</h1>
          <p className="text-muted-foreground mt-1">Review risk snapshots and recommended backups.</p>
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account</TableHead>
              <TableHead>Risk level</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Top reason</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{accountNames.get(row.account_id) || row.account_id}</TableCell>
                <TableCell className="capitalize">{row.risk_level}</TableCell>
                <TableCell>{row.risk_score}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{row.reasons?.[0] ?? '—'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{new Date(row.updated_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Link href={`/app/ops/risk/${row.account_id}`}>
                    <Button variant="ghost" size="sm">View</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {list.length === 0 && (
          <div className="px-4 py-8 text-center text-muted-foreground text-sm">No active risk snapshots.</div>
        )}
      </div>
    </div>
  );
}
