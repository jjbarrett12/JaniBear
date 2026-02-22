import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';

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
      clients (id, name),
      accounts (id, name),
      locations (id, name)
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Pipeline</h1>
        <p className="text-muted-foreground mt-1">Opportunities by stage · next activity on cards</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const list = byStage.get(stage) ?? [];
          return (
            <div key={stage} className="w-72 shrink-0 flex flex-col rounded-lg border bg-card">
              <div className="px-3 py-2 border-b bg-muted/50">
                <h2 className="font-semibold text-sm capitalize">{stage.replace('_', ' ')}</h2>
                <p className="text-xs text-muted-foreground">{list.length} deal{list.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[120px]">
                {list.map((opp: { id: string; stage?: string; est_mrr?: number; est_value?: number; client_id?: string; account_id?: string; location_id?: string; clients?: { id: string; name: string } | null; accounts?: { id: string; name: string } | null; locations?: { id: string; name: string } | null }) => {
                  const next = nextActivityByOpp.get(opp.id);
                  const name = (opp.clients as { name: string } | null)?.name ?? (opp.accounts as { name: string } | null)?.name ?? 'No client';
                  return (
                    <Link key={opp.id} href={`/app/crm/opportunities/${opp.id}`}>
                      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardContent className="p-3">
                          <p className="font-medium text-sm truncate">
                            {name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {(opp.locations as { name: string })?.name ?? 'No site'}
                          </p>
                          {(opp.est_mrr != null || opp.est_value != null) && (
                            <p className="text-xs mt-1">
                              {opp.est_mrr != null && `$${Number(opp.est_mrr).toLocaleString()}/mo`}
                              {opp.est_value != null && ` · $${Number(opp.est_value).toLocaleString()} value`}
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
