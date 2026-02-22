import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { SalesPageShell } from '@/components/sales/page-shell';
import { PageHeader } from '@/components/sales/page-header';
import { PipelineBoardTableWithDrawer } from '@/components/sales/pipeline-board-table-with-drawer';

const STAGES = ['new', 'prospect', 'walkthrough', 'drafted', 'delivered', 'negotiating', 'verbal_yes', 'signed', 'won', 'lost'];

export default async function SalesPipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ highlight?: string }>;
}) {
  const { highlight: highlightOppId } = await searchParams;
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: opportunities } = await supabase
    .from('opportunities')
    .select(`
      id, stage, est_mrr, est_value, created_at,
      client_id, account_id, location_id,
      clients (id, name), accounts (id, name), locations (id, name)
    `)
    .eq('org_id', org.org_id)
    .order('created_at', { ascending: false });

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

  const nextActivityList: { opportunityId: string; due_at: string; subject: string | null; type: string }[] = [];
  const seen = new Set<string>();
  (activities ?? []).forEach((a: { opportunity_id: string; due_at: string; subject: string | null; type: string }) => {
    if (!a.opportunity_id || seen.has(a.opportunity_id)) return;
    seen.add(a.opportunity_id);
    nextActivityList.push({ opportunityId: a.opportunity_id, due_at: a.due_at, subject: a.subject ?? null, type: a.type ?? 'task' });
  });

  return (
    <SalesPageShell
      breadcrumb={
        <span className="text-muted-foreground">
          Sales <span className="text-foreground/80">/ Pipeline</span>
        </span>
      }
    >
      <div className="p-4 md:p-6 space-y-6">
        <PageHeader
          title="Pipeline"
          description="Qualified opportunities by stage. Click a card to open details."
        />
        <PipelineBoardTableWithDrawer
          opportunities={opportunities ?? []}
          stages={STAGES}
          nextActivityList={nextActivityList}
          orgId={org.org_id}
          initialHighlightOppId={highlightOppId ?? undefined}
        />
      </div>
    </SalesPageShell>
  );
}
