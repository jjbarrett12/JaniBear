'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { RightDrawer } from '@/components/sales/right-drawer';
import { getOpportunityDetail } from '@/actions/crm';
import type { OpportunityDetail } from '@/actions/crm';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Calendar, LayoutGrid, List, FileSearch, FileText, Calculator, Trophy, XCircle } from 'lucide-react';

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

export function PipelineBoardTableWithDrawer({
  opportunities,
  stages,
  nextActivityList,
  orgId,
  initialHighlightOppId,
}: {
  opportunities: OppRow[];
  stages: string[];
  nextActivityList: { opportunityId: string; due_at: string; subject: string | null; type: string }[];
  orgId: string;
  initialHighlightOppId?: string;
}) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'board' | 'table'>('board');
  const [drawerOppId, setDrawerOppId] = useState<string | null>(initialHighlightOppId ?? null);
  const [drawerData, setDrawerData] = useState<OpportunityDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const nextByOpp = new Map(nextActivityList.map((a) => [a.opportunityId, a]));

  useEffect(() => {
    if (!drawerOppId) {
      setDrawerData(null);
      return;
    }
    setLoading(true);
    getOpportunityDetail(orgId, drawerOppId).then((d) => {
      setDrawerData(d);
      setLoading(false);
    });
  }, [drawerOppId, orgId]);

  const byStage = new Map<string | undefined, OppRow[]>();
  stages.forEach((s) => byStage.set(s, []));
  opportunities.forEach((o) => {
    const stage = o.stage ?? 'new';
    const list = byStage.get(stage) ?? [];
    list.push(o);
    byStage.set(stage, list);
  });

  const oppName = (o: OppRow) =>
    (o.clients as { name?: string } | null)?.name ?? (o.accounts as { name?: string } | null)?.name ?? 'No account';
  const locationName = (o: OppRow) => (o.locations as { name?: string } | null)?.name ?? '—';

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant={viewMode === 'board' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('board')}
          className="gap-2"
        >
          <LayoutGrid className="h-4 w-4" />
          Board
        </Button>
        <Button
          variant={viewMode === 'table' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('table')}
          className="gap-2"
        >
          <List className="h-4 w-4" />
          Table
        </Button>
      </div>

      {viewMode === 'board' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => {
            const list = byStage.get(stage) ?? [];
            return (
              <div key={stage} className="w-72 shrink-0 flex flex-col rounded-lg border bg-card">
                <div className="px-3 py-2 border-b bg-muted/50">
                  <h2 className="font-semibold text-sm capitalize">{stage.replace(/_/g, ' ')}</h2>
                  <p className="text-xs text-muted-foreground">{list.length} deal{list.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[120px]">
                  {list.map((opp) => {
                    const next = nextByOpp.get(opp.id);
                    return (
                      <Card
                        key={opp.id}
                        className="hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => setDrawerOppId(opp.id)}
                      >
                        <CardContent className="p-3">
                          <p className="font-medium text-sm truncate">{oppName(opp)}</p>
                          <p className="text-xs text-muted-foreground truncate">{locationName(opp)}</p>
                          {(opp.est_mrr != null || opp.est_value != null) && (
                            <p className="text-xs mt-1">
                              {opp.est_mrr != null && `${formatCurrency(Number(opp.est_mrr))}/mo`}
                              {opp.est_value != null && ` · ${formatCurrency(Number(opp.est_value))} value`}
                            </p>
                          )}
                          {next && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3 shrink-0" />
                              <span>{formatDate(next.due_at)}</span>
                              {next.subject && <span className="truncate">· {next.subject}</span>}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Next activity</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {opportunities.map((opp) => {
                const next = nextByOpp.get(opp.id);
                return (
                  <TableRow
                    key={opp.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setDrawerOppId(opp.id)}
                  >
                    <TableCell className="font-medium">{oppName(opp)}</TableCell>
                    <TableCell className="capitalize">{opp.stage?.replace(/_/g, ' ') ?? 'new'}</TableCell>
                    <TableCell>
                      {opp.est_value != null ? formatCurrency(Number(opp.est_value)) : opp.est_mrr != null ? formatCurrency(Number(opp.est_mrr)) + '/mo' : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {next ? formatDate(next.due_at) : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatDate(opp.created_at)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <RightDrawer
        open={drawerOppId != null}
        onClose={() => setDrawerOppId(null)}
        title={loading ? 'Loading…' : drawerData?.opportunity ? `${drawerData.account?.name ?? drawerData.client?.name ?? 'Opportunity'} · ${drawerData.opportunity.stage}` : 'Opportunity'}
      >
        {loading ? (
          <div className="p-6 text-muted-foreground">Loading…</div>
        ) : drawerData?.opportunity && drawerOppId ? (
          <OpportunityDrawerContent data={drawerData} oppId={drawerOppId} onClose={() => setDrawerOppId(null)} />
        ) : (
          <div className="p-6 text-muted-foreground">Opportunity not found.</div>
        )}
      </RightDrawer>
    </>
  );
}

function OpportunityDrawerContent({
  data,
  oppId,
  onClose,
}: {
  data: OpportunityDetail;
  oppId: string;
  onClose: () => void;
}) {
  const { opportunity, account, client, location, walkthroughs, bids, activities } = data;
  const accountName = account?.name ?? client?.name ?? '—';

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 gap-2 text-sm">
        <span className="text-muted-foreground">Stage</span>
        <span className="font-medium capitalize">{opportunity?.stage?.replace(/_/g, ' ')}</span>
        <span className="text-muted-foreground">Value</span>
        <span>{opportunity?.est_value != null ? formatCurrency(Number(opportunity.est_value)) : opportunity?.est_mrr != null ? formatCurrency(Number(opportunity.est_mrr)) + '/mo' : '—'}</span>
        <span className="text-muted-foreground">Account</span>
        <span>{accountName}</span>
        {location && (
          <>
            <span className="text-muted-foreground">Location</span>
            <span>{location.name}</span>
          </>
        )}
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Walkthroughs</h3>
        {walkthroughs.length === 0 ? (
          <p className="text-sm text-muted-foreground">None</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {walkthroughs.map((w) => (
              <li key={w.id}>
                <Link href={`/app/walkthroughs/${w.id}`} className="text-primary hover:underline">
                  {w.status} {w.scheduled_at ? formatDate(w.scheduled_at) : ''}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Bids / Scope</h3>
        {bids.length === 0 ? <p className="text-sm text-muted-foreground">None</p> : (
          <ul className="space-y-1 text-sm">
            {bids.map((b) => (
              <li key={b.id}>{formatCurrency(b.total_estimated_cost ?? 0)} — {b.status}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-2 pt-4 border-t border-border">
        <Link href={`/app/sales/walkthroughs`}>
          <Button variant="outline" size="sm" className="w-full gap-2 justify-start">
            <FileSearch className="h-4 w-4" />
            Schedule walkthrough
          </Button>
        </Link>
        <Link href={`/app/sales/scope`}>
          <Button variant="outline" size="sm" className="w-full gap-2 justify-start">
            <FileText className="h-4 w-4" />
            Create scope
          </Button>
        </Link>
        <Link href={`/app/proposals/build`}>
          <Button variant="outline" size="sm" className="w-full gap-2 justify-start">
            <Calculator className="h-4 w-4" />
            Generate proposal
          </Button>
        </Link>
        {opportunity?.stage !== 'won' && opportunity?.stage !== 'lost' && (
          <>
            <Link href={`/app/crm/opportunities/${oppId}?mark=won`}>
              <Button variant="outline" size="sm" className="w-full gap-2 justify-start text-green-700 dark:text-green-400">
                <Trophy className="h-4 w-4" />
                Mark won
              </Button>
            </Link>
            <Link href={`/app/crm/opportunities/${oppId}?mark=lost`}>
              <Button variant="outline" size="sm" className="w-full gap-2 justify-start text-destructive">
                <XCircle className="h-4 w-4" />
                Mark lost
              </Button>
            </Link>
          </>
        )}
      </div>
      <Link href={`/app/crm/opportunities/${oppId}`}>
        <Button variant="ghost" size="sm" className="w-full">Open full opportunity</Button>
      </Link>
    </div>
  );
}
