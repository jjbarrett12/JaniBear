import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import Link from 'next/link';
import { SalesPageShell } from '@/components/sales/page-shell';
import { PageHeader } from '@/components/sales/page-header';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { WalkthroughsTableCalendar } from '@/components/sales/walkthroughs-table-calendar';
import { SALES_COPY } from '@/lib/sales-module-copy';

export default async function SalesWalkthroughsPage() {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: walkthroughs } = await supabase
    .from('walkthroughs')
    .select('id, status, scheduled_at, opportunity_id')
    .eq('org_id', org.org_id)
    .order('scheduled_at', { ascending: false, nullsFirst: false });

  const oppIds = [...new Set((walkthroughs ?? []).map((w) => w.opportunity_id).filter(Boolean))] as string[];
  const { data: opps } = oppIds.length
    ? await supabase.from('opportunities').select('id, account_id, client_id').in('id', oppIds).eq('org_id', org.org_id)
    : { data: [] };
  const accountIds = [...new Set((opps ?? []).map((o) => (o as { account_id?: string }).account_id).filter(Boolean))] as string[];
  const clientIds = [...new Set((opps ?? []).map((o) => (o as { client_id?: string }).client_id).filter(Boolean))] as string[];
  const { data: accounts } = accountIds.length ? await supabase.from('accounts').select('id, name').in('id', accountIds) : { data: [] };
  const { data: clients } = clientIds.length ? await supabase.from('clients').select('id, name').in('id', clientIds) : { data: [] };
  const accountByName = new Map((accounts ?? []).map((a) => [a.id, a.name]));
  const clientByName = new Map((clients ?? []).map((c) => [c.id, c.name]));
  const oppToName = new Map(
    (opps ?? []).map((o) => {
      const o2 = o as { id: string; account_id?: string; client_id?: string };
      const name = o2.account_id ? accountByName.get(o2.account_id) : o2.client_id ? clientByName.get(o2.client_id) : null;
      return [o2.id, name ?? '—'];
    })
  );

  const list = (walkthroughs ?? []).map((w) => ({
    id: w.id,
    status: w.status,
    scheduled_at: w.scheduled_at,
    opportunity_id: w.opportunity_id,
    accountName: w.opportunity_id ? oppToName.get(w.opportunity_id) ?? '—' : '—',
  }));

  return (
    <SalesPageShell
      breadcrumb={
        <span className="text-muted-foreground">
          Sales <span className="text-foreground/80">/ Walkthroughs</span>
        </span>
      }
    >
      <div className="mx-auto w-full max-w-[1400px] px-4 py-5 sm:px-6 sm:py-6 space-y-5">
        <PageHeader
          title={SALES_COPY.walkthroughs.title}
          description={SALES_COPY.walkthroughs.description}
          strap={SALES_COPY.walkthroughs.strap}
          primaryCta={
            <Link href="/app/walkthroughs/new">
              <Button size="sm" className="gap-2 h-9">
                <Plus className="h-4 w-4" />
                {SALES_COPY.walkthroughs.newWalkthrough}
              </Button>
            </Link>
          }
        />
        <WalkthroughsTableCalendar walkthroughs={list} />
      </div>
    </SalesPageShell>
  );
}
