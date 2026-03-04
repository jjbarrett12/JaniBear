'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useSalesData } from '@/contexts/sales-data-context';
import type { WidgetDefinition } from '../types';
import { UserPlus, Calendar, FileText, TrendingUp, ListOrdered, ArrowRight } from 'lucide-react';

const STAGES = [
  { key: 'new', label: 'New', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200' },
  { key: 'walkthrough_scheduled', label: 'Walk-through Scheduled', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  { key: 'walkthrough_done', label: 'Walk-through Done', color: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300' },
  { key: 'proposal_sent', label: 'Proposal Sent', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  { key: 'won', label: 'Won', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
];

function NewLeadsWidget({ orgId: _orgId }: { orgId: string }) {
  const { byStage } = useSalesData();
  const count = byStage.new?.length ?? 0;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">New</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{count}</p>
      </CardContent>
    </Card>
  );
}

function WalkthroughsWidget({ orgId: _orgId }: { orgId: string }) {
  const { byStage } = useSalesData();
  const count = (byStage.walkthrough_scheduled?.length ?? 0) + (byStage.walkthrough_done?.length ?? 0);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Walk-throughs</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{count}</p>
      </CardContent>
    </Card>
  );
}

function ProposalsSentWidget({ orgId: _orgId }: { orgId: string }) {
  const { byStage } = useSalesData();
  const count = byStage.proposal_sent?.length ?? 0;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Proposals Sent</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{count}</p>
      </CardContent>
    </Card>
  );
}

function WonWidget({ orgId: _orgId }: { orgId: string }) {
  const { byStage } = useSalesData();
  const count = byStage.won?.length ?? 0;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Won</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{count}</p>
      </CardContent>
    </Card>
  );
}

function PipelineWidget({ orgId: _orgId }: { orgId: string }) {
  const { byStage } = useSalesData();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pipeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {STAGES.map((s) => (
            <div key={s.key} className="flex items-center gap-2">
              <span className={`text-xs font-medium px-2 py-1 rounded ${s.color}`}>{s.label}</span>
              <span className="text-sm tabular-nums">{byStage[s.key]?.length ?? 0}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RecentLeadsWidget({ orgId: _orgId }: { orgId: string }) {
  const { leads } = useSalesData();
  const recent = leads.slice(0, 5);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Recent Leads</CardTitle>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No leads yet.</p>
        ) : (
          <ul className="space-y-2">
            {recent.map((lead) => (
              <li key={lead.id}>
                <Link href={`/app/sales/leads/${lead.id}`} className="block p-2 rounded-lg border border-border hover:bg-muted/50 text-sm">
                  <span className="font-medium">{lead.contact_name || lead.company || 'Unnamed'}</span>
                  {lead.company && lead.contact_name && (
                    <span className="text-muted-foreground text-xs block">{lead.company}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export const salesWidgetRegistry: WidgetDefinition[] = [
  { id: 'sales_new', title: 'New Leads', description: 'New lead count', icon: <UserPlus className="h-4 w-4" />, component: NewLeadsWidget, default: { lg: { x: 0, y: 0, w: 1, h: 1 }, md: { x: 0, y: 0, w: 1, h: 1 }, sm: { x: 0, y: 0, w: 1, h: 1 } }, minW: 1, minH: 1 },
  { id: 'sales_walkthroughs', title: 'Walk-throughs', description: 'Scheduled + done', icon: <Calendar className="h-4 w-4" />, component: WalkthroughsWidget, default: { lg: { x: 1, y: 0, w: 1, h: 1 }, md: { x: 1, y: 0, w: 1, h: 1 }, sm: { x: 0, y: 1, w: 1, h: 1 } }, minW: 1, minH: 1 },
  { id: 'sales_proposals', title: 'Proposals Sent', description: 'Proposal sent count', icon: <FileText className="h-4 w-4" />, component: ProposalsSentWidget, default: { lg: { x: 2, y: 0, w: 1, h: 1 }, md: { x: 0, y: 1, w: 1, h: 1 }, sm: { x: 0, y: 2, w: 1, h: 1 } }, minW: 1, minH: 1 },
  { id: 'sales_won', title: 'Won', description: 'Won deals', icon: <TrendingUp className="h-4 w-4" />, component: WonWidget, default: { lg: { x: 3, y: 0, w: 1, h: 1 }, md: { x: 1, y: 1, w: 1, h: 1 }, sm: { x: 0, y: 3, w: 1, h: 1 } }, minW: 1, minH: 1 },
  { id: 'sales_pipeline', title: 'Pipeline', description: 'Stage counts', icon: <ListOrdered className="h-4 w-4" />, component: PipelineWidget, default: { lg: { x: 0, y: 1, w: 2, h: 1 }, md: { x: 0, y: 2, w: 2, h: 1 }, sm: { x: 0, y: 4, w: 1, h: 1 } }, minW: 1, minH: 1 },
  { id: 'sales_recent', title: 'Recent Leads', description: 'Latest leads', icon: <ArrowRight className="h-4 w-4" />, component: RecentLeadsWidget, default: { lg: { x: 2, y: 1, w: 2, h: 1 }, md: { x: 0, y: 3, w: 2, h: 1 }, sm: { x: 0, y: 5, w: 1, h: 1 } }, minW: 1, minH: 1 },
];
