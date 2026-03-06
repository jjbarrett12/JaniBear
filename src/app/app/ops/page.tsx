import { redirect } from 'next/navigation';
import Link from 'next/link';
import { headers } from 'next/headers';
import { requireOrg, getCurrentUserId } from '@/lib/auth';
import { requirePermission } from '@/lib/auth/requirePermission';
import { isAuthzError, isAuthContextError, getAuthContextRedirectPath } from '@/lib/auth/errors';
import { getAccountsAtRiskForOps } from '@/lib/risk/ops-risk-data';
import { getCoverageGapsForDate } from '@/lib/shifts/coverage-gaps-data';
import { Button } from '@/components/ui/button';
import { CoverageGapsWidget } from '@/components/ops/CoverageGapsWidget';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertTriangle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function OpsPage() {
  const org = await requireOrg();
  const userId = await getCurrentUserId();
  if (!userId) redirect('/auth/login');
  const pathname = (await headers()).get('x-pathname') ?? '/app/ops';
  try {
    await requirePermission({ orgId: org.org_id, userId, permission: 'dashboard.ops', pathname });
  } catch (e) {
    if (isAuthzError(e)) redirect('/app/forbidden');
    if (isAuthContextError(e)) redirect(getAuthContextRedirectPath(e.code));
    redirect('/app/authz-error');
  }

  const [atRisk, coverageGaps] = await Promise.all([
    getAccountsAtRiskForOps(org.org_id),
    getCoverageGapsForDate(org.org_id, new Date().toISOString().slice(0, 10)),
  ]);
  const { count: atRiskCount, list: atRiskList } = atRisk;
  const todayLabel = 'Tonight';

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Operations</h1>
        <p className="text-muted-foreground mt-1">Overview and accounts at risk.</p>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h2 className="font-semibold text-foreground">Accounts at Risk</h2>
            <span className="text-sm text-muted-foreground">(high + critical)</span>
          </div>
          {atRiskCount > 0 && (
            <Link href="/app/ops/risk">
              <Button variant="outline" size="sm">View all</Button>
            </Link>
          )}
        </div>
        {atRiskCount === 0 ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">
            No accounts currently at high or critical risk.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Top reason</TableHead>
                <TableHead>Operator</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {atRiskList.slice(0, 10).map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.account_name || row.account_id}</TableCell>
                  <TableCell>
                    <span className={`capitalize ${row.risk_level === 'critical' ? 'text-destructive font-medium' : 'text-amber-600'}`}>
                      {row.risk_level}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{row.top_reason ?? '—'}</TableCell>
                  <TableCell className="text-sm capitalize">{row.operator_type}</TableCell>
                  <TableCell className="text-right">{row.risk_score}</TableCell>
                  <TableCell>
                    <Link href={`/app/ops/risk/${row.account_id}`}>
                      <Button variant="ghost" size="sm">View risk</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <CoverageGapsWidget gaps={coverageGaps} dateLabel={todayLabel} />
    </div>
  );
}
