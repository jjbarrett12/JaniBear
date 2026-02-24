import { requireOrg } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { KpiDataProvider } from '@/contexts/kpi-data-context';
import { getKpiSummary } from '@/actions/kpi-command-center';
import { ReportsModuleClient } from './reports-module-client';
import { Suspense } from 'react';

const STAGES = ['new', 'prospect', 'walkthrough', 'drafted', 'delivered', 'negotiating', 'verbal_yes', 'signed', 'won', 'lost'];

type TabParam = 'dashboard' | 'performance' | 'pipeline' | 'rep';

export default async function KpiDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; highlight?: string }>;
}) {
  const org = await requireOrg();
  const supabase = await createClient();
  const { tab: tabParam, highlight: highlightOppId } = await searchParams;
  const defaultTab: TabParam = tabParam === 'performance' || tabParam === 'pipeline' || tabParam === 'rep' ? tabParam : 'dashboard';

  const [
    kpiSummary,
    { data: opportunities },
    { data: closed },
  ] = await Promise.all([
    getKpiSummary(org.org_id),
    supabase
      .from('opportunities')
      .select(`
        id, stage, est_mrr, est_value, created_at,
        client_id, account_id, location_id,
        clients (id, name), accounts (id, name), locations (id, name)
      `)
      .eq('org_id', org.org_id)
      .order('created_at', { ascending: false }),
    supabase
      .from('opportunities')
      .select('id, stage, est_mrr, est_value, created_at, closed_at, won_at, account_id')
      .eq('org_id', org.org_id)
      .in('stage', ['won', 'lost'])
      .order('closed_at', { ascending: false, nullsFirst: false }),
  ]);

  const oppIds = (opportunities ?? []).map((o) => o.id);
  const { data: activities } = oppIds.length
    ? await supabase
        .from('crm_activities')
        .select('opportunity_id, due_at, subject, type, completed_at')
        .in('opportunity_id', oppIds)
        .is('completed_at', null)
        .not('due_at', 'is', null)
        .order('due_at', { ascending: true })
    : { data: [] };

  const oppList = opportunities ?? [];
  const nextActivityList: { opportunityId: string; due_at: string; subject: string | null; type: string }[] = [];
  const seen = new Set<string>();
  (activities ?? []).forEach((a: { opportunity_id: string; due_at: string; subject: string | null; type: string }) => {
    if (!a.opportunity_id || seen.has(a.opportunity_id)) return;
    seen.add(a.opportunity_id);
    nextActivityList.push({ opportunityId: a.opportunity_id, due_at: a.due_at, subject: a.subject ?? null, type: a.type ?? 'task' });
  });

  const list = (closed ?? []) as {
    id: string;
    stage: string;
    est_mrr?: number | null;
    est_value?: number | null;
    created_at: string;
    closed_at: string | null;
    won_at: string | null;
    account_id?: string | null;
  }[];
  const won = list.filter((o) => o.stage === 'won');
  const totalClosed = list.length;
  const winRate = totalClosed ? Math.round((won.length / totalClosed) * 100) : 0;
  const totalValue = list.reduce((s, o) => s + (Number(o.est_value ?? o.est_mrr ?? 0) || 0), 0);
  const avgDealSize = won.length ? totalValue / won.length : 0;
  const cycleDaysList = list
    .filter((o) => o.closed_at && o.created_at)
    .map((o) => (new Date(o.closed_at!).getTime() - new Date(o.created_at).getTime()) / (1000 * 60 * 60 * 24));
  const avgCycleDays = cycleDaysList.length ? Math.round(cycleDaysList.reduce((a, b) => a + b, 0) / cycleDaysList.length) : 0;

  return (
    <KpiDataProvider>
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-card/50 px-4 py-6">
          <div className="max-w-[1400px] mx-auto">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Reports</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Performance, pipeline analytics, KPIs, and rep performance in one place.
            </p>
          </div>
        </div>
        <div className="p-4 md:p-6">
          <Suspense fallback={<div className="text-muted-foreground">Loading…</div>}>
            <ReportsModuleClient
              defaultTab={defaultTab}
              kpiSummary={kpiSummary}
              pipelineData={{ opportunities: oppList, nextActivityList }}
              winLossData={{ list, winRate, avgDealSize, avgCycleDays }}
              orgId={org.org_id}
              initialHighlightOppId={highlightOppId ?? undefined}
            />
          </Suspense>
        </div>
      </div>
    </KpiDataProvider>
  );
}
