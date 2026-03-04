'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { KpiDashboardPageV2 } from '@/components/kpi/KpiDashboardPageV2';
import { KpiCommandCenterContent } from '@/components/kpi/KpiCommandCenterContent';
import { PipelineBoardTableWithDrawer } from '@/components/sales/pipeline-board-table-with-drawer';
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
import type { KpiSummaryRow } from '@/lib/kpi-command-center';

const STAGES = ['new', 'prospect', 'walkthrough', 'drafted', 'delivered', 'negotiating', 'verbal_yes', 'signed', 'won', 'lost'];

type OppRow = {
  id: string;
  stage?: string;
  est_mrr?: number | null;
  est_value?: number | null;
  created_at: string;
  client_id?: string | null;
  account_id?: string | null;
  location_id?: string | null;
  clients?: { id: string; name: string } | null;
  accounts?: { id: string; name: string } | null;
  locations?: { id: string; name: string } | null;
};

type ClosedOpp = {
  id: string;
  stage: string;
  est_mrr?: number | null;
  est_value?: number | null;
  created_at: string;
  closed_at: string | null;
  won_at: string | null;
  account_id?: string | null;
};

function oppLabel(o: ClosedOpp): string {
  return `Deal ${o.id.slice(0, 8)}`;
}

export function ReportsModuleClient({
  defaultTab,
  kpiSummary,
  pipelineData,
  winLossData,
  orgId,
  initialHighlightOppId,
}: {
  defaultTab: 'dashboard' | 'performance' | 'pipeline' | 'rep';
  kpiSummary: KpiSummaryRow | null;
  pipelineData: {
    opportunities: OppRow[];
    nextActivityList: { opportunityId: string; due_at: string; subject: string | null; type: string }[];
  };
  winLossData: {
    list: ClosedOpp[];
    winRate: number;
    avgDealSize: number;
    avgCycleDays: number;
  };
  orgId: string;
  initialHighlightOppId?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = (searchParams.get('tab') as 'dashboard' | 'performance' | 'pipeline' | 'rep') || defaultTab;

  const setTab = (value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value === 'dashboard') next.delete('tab');
    else next.set('tab', value);
    router.replace(`/app/kpis?${next.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-4 h-auto flex-wrap gap-1">
          <TabsTrigger value="dashboard" className="text-xs sm:text-sm">KPI Dashboard</TabsTrigger>
          <TabsTrigger value="performance" className="text-xs sm:text-sm">Performance</TabsTrigger>
          <TabsTrigger value="pipeline" className="text-xs sm:text-sm">Pipeline Analytics</TabsTrigger>
          <TabsTrigger value="rep" className="text-xs sm:text-sm">Rep Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <KpiDashboardPageV2 />
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <div className="min-h-screen">
            <KpiCommandCenterContent summary={kpiSummary} />
          </div>
        </TabsContent>

        <TabsContent value="pipeline" className="mt-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Pipeline Analytics</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Qualified opportunities by stage. Click a card to open details.
              </p>
            </div>
            <PipelineBoardTableWithDrawer
              opportunities={pipelineData.opportunities}
              stages={STAGES}
              nextActivityList={pipelineData.nextActivityList}
              orgId={orgId}
              initialHighlightOppId={initialHighlightOppId}
            />
          </div>
        </TabsContent>

        <TabsContent value="rep" className="mt-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Rep Performance</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Closed opportunities: win rate, deal size, cycle time, and reason codes.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Win rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <span className="text-2xl font-bold">{winLossData.winRate}%</span>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Avg deal size</CardTitle>
                </CardHeader>
                <CardContent>
                  <span className="text-2xl font-bold">{formatCurrency(winLossData.avgDealSize)}</span>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Avg cycle (days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <span className="text-2xl font-bold">{winLossData.avgCycleDays}</span>
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
                  Won and lost deals. Reason codes and notes can be added on detail.
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
                      {winLossData.list.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No closed opportunities yet. Mark deals Won or Lost in Pipeline to see them here.
                          </TableCell>
                        </TableRow>
                      ) : (
                        winLossData.list.map((o) => (
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
                                <span className="text-xs text-muted-foreground">Add to nurture / Next attempt (TODO)</span>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
