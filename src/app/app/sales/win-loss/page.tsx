import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { SalesPageShell } from '@/components/sales/page-shell';
import { PageHeader } from '@/components/sales/page-header';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate, formatCurrency } from '@/lib/utils';
import Link from 'next/link';

export default async function WinLossPage() {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: closed } = await supabase
    .from('opportunities')
    .select('id, stage, est_mrr, est_value, created_at, closed_at, won_at')
    .eq('org_id', org.org_id)
    .in('stage', ['won', 'lost'])
    .order('closed_at', { ascending: false, nullsFirst: false });

  const list = (closed ?? []) as {
    id: string;
    stage: string;
    est_mrr?: number | null;
    est_value?: number | null;
    created_at: string;
    closed_at: string | null;
    won_at: string | null;
  }[];

  const won = list.filter((o) => o.stage === 'won');
  const lost = list.filter((o) => o.stage === 'lost');
  const totalClosed = list.length;
  const winRate = totalClosed ? Math.round((won.length / totalClosed) * 100) : 0;
  const totalValue = list.reduce((s, o) => s + (Number(o.est_value ?? o.est_mrr ?? 0) || 0), 0);
  const avgDealSize = won.length ? totalValue / won.length : 0;
  const cycleDaysList = list
    .filter((o) => o.closed_at && o.created_at)
    .map((o) => (new Date(o.closed_at!).getTime() - new Date(o.created_at).getTime()) / (1000 * 60 * 60 * 24));
  const avgCycleDays = cycleDaysList.length ? Math.round(cycleDaysList.reduce((a, b) => a + b, 0) / cycleDaysList.length) : 0;

  return (
    <SalesPageShell
      breadcrumb={
        <span className="text-muted-foreground">
          Sales <span className="text-foreground/80">/ Win/Loss</span>
        </span>
      }
    >
      <div className="p-4 md:p-6 space-y-6">
        <PageHeader
          title="Win/Loss"
          description="Closed opportunities: win rate, deal size, cycle time, and reason codes."
        />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Win rate</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{winRate}%</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg deal size</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{formatCurrency(avgDealSize)}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg cycle (days)</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{avgCycleDays}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Top loss reasons</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-sm text-muted-foreground">—</span>
              <p className="text-xs text-muted-foreground mt-1">Reason codes coming soon</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Top win sources</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-sm text-muted-foreground">—</span>
              <p className="text-xs text-muted-foreground mt-1">Source tracking coming soon</p>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Closed opportunities</CardTitle>
            <p className="text-sm text-muted-foreground">
              Won and lost deals. Reason codes and notes can be added on detail (stub: Add to nurture / Next attempt).
            </p>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Opportunity</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Closed</TableHead>
                    <TableHead>Reason / notes</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No closed opportunities yet. Mark deals Won or Lost in Pipeline to see them here.
                      </TableCell>
                    </TableRow>
                  ) : (
                    list.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-medium">
                          <Link href={`/app/sales/accounts${o.account_id ? `/${o.account_id}` : ''}`} className="text-primary hover:underline">
                            {oppLabel(o)}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant={o.stage === 'won' ? 'default' : 'destructive'} className="capitalize">
                            {o.stage}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {o.est_value != null || o.est_mrr != null
                            ? formatCurrency(Number(o.est_value ?? o.est_mrr ?? 0))
                            : '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {o.closed_at ? formatDate(o.closed_at) : o.won_at ? formatDate(o.won_at) : '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">—</TableCell>
                        <TableCell>
                          {o.stage === 'lost' && (
                            <span className="text-xs text-muted-foreground">
                              Add to nurture / Next attempt (TODO)
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </SalesPageShell>
  );
}
