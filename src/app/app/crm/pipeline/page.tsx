import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { SALES_COPY } from '@/lib/sales-module-copy';

const STAGES = ['new', 'prospect', 'walkthrough', 'drafted', 'delivered', 'negotiating', 'verbal_yes', 'signed', 'won', 'lost'];

export default async function PipelinePage() {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: opportunities } = await supabase
    .from('opportunities')
    .select(`
      id,
      stage,
      est_mrr,
      est_value,
      created_at,
      client_id,
      account_id,
      location_id,
      facility_id,
      clients (id, name),
      accounts (id, name),
      locations (id, name),
      facilities (id, name)
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

  const nextActivityByOpp = new Map<string, { due_at: string; subject: string | null; type: string }>();
  (activities ?? []).forEach((a) => {
    if (!a.opportunity_id) return;
    if (!nextActivityByOpp.has(a.opportunity_id)) {
      nextActivityByOpp.set(a.opportunity_id, {
        due_at: a.due_at,
        subject: a.subject ?? null,
        type: a.type ?? 'task',
      });
    }
  });

  const byStage = new Map<string, typeof opportunities>();
  STAGES.forEach((s) => byStage.set(s, []));
  (opportunities ?? []).forEach((o) => {
    const stage = (o.stage as string) || 'new';
    const list = byStage.get(stage) ?? [];
    list.push(o);
    byStage.set(stage, list);
  });

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">{SALES_COPY.pipeline.strap}</p>
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl mt-0.5">{SALES_COPY.pipeline.title}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{SALES_COPY.pipeline.description}</p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4 -mx-1">
        {STAGES.map((stage) => {
          const list = byStage.get(stage) ?? [];
          return (
            <div key={stage} className="w-[280px] shrink-0 flex flex-col rounded-xl border border-border bg-card/80 dark:bg-card/90 overflow-hidden">
              <div className="px-3 py-2.5 border-b border-border bg-muted/30">
                <h2 className="font-semibold text-xs uppercase tracking-wider text-foreground">{stage.replace(/_/g, ' ')}</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">{list.length} deal{list.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[140px]">
                {list.map((opp: { id: string; stage?: string; est_mrr?: number; est_value?: number; client_id?: string; account_id?: string; location_id?: string; facility_id?: string; clients?: { id: string; name: string } | null; accounts?: { id: string; name: string } | null; locations?: { id: string; name: string } | null; facilities?: { id: string; name: string } | null }) => {
                  const next = nextActivityByOpp.get(opp.id);
                  const name = (opp.clients as { name: string } | null)?.name ?? (opp.accounts as { name: string } | null)?.name ?? 'No client';
                  const siteName = (opp.facilities as { name: string } | null)?.name ?? (opp.locations as { name: string } | null)?.name ?? 'No site';
                  const value = opp.est_mrr ?? opp.est_value;
                  return (
                    <Link key={opp.id} href={`/app/crm/opportunities/${opp.id}`}>
                      <div className="rounded-lg border border-border bg-background/50 hover:bg-muted/40 hover:border-primary/20 p-3 transition-all duration-200 cursor-pointer">
                        <p className="font-medium text-sm text-foreground truncate">{name}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{siteName}</p>
                        {value != null && (
                          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1.5 tabular-nums">
                            ${Number(value).toLocaleString()}{opp.est_mrr != null ? '/mo' : ''}
                          </p>
                        )}
                        {next && (
                          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground">
                            <Calendar className="h-3 w-3 shrink-0" />
                            <span className="tabular-nums">{formatDate(next.due_at)}</span>
                            {next.subject && <span className="truncate">· {next.subject}</span>}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
