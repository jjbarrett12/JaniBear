import { createClient } from '@/lib/supabase/server';
import { requireOrg, getCurrentUserId } from '@/lib/auth';
import Link from 'next/link';
import { SalesPageShell } from '@/components/sales/page-shell';
import { PageHeader } from '@/components/sales/page-header';
import { Button } from '@/components/ui/button';
import { SALES_COPY } from '@/lib/sales-module-copy';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Rocket } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import { getPlanType } from '@/lib/is-premium';
import { MarkAsWonButton } from '@/components/sales/mark-as-won-button';

export default async function SalesProposalsPage() {
  const org = await requireOrg();
  const supabase = await createClient();
  const userId = await getCurrentUserId();
  const planType = await getPlanType(org.org_id, userId);
  const isCub = planType === 'cub';

  const { data: proposals } = await supabase
    .from('proposals')
    .select('id, lead_id, opportunity_id, total_amount, status, sent_at, created_at')
    .eq('org_id', org.org_id)
    .order('created_at', { ascending: false });

  const leadIds = [...new Set((proposals ?? []).map((p) => p.lead_id).filter(Boolean))] as string[];
  const oppIds = [...new Set((proposals ?? []).map((p) => p.opportunity_id).filter(Boolean))] as string[];
  const { data: leads } = leadIds.length ? await supabase.from('leads').select('id, company, contact_name').in('id', leadIds) : { data: [] };
  const { data: opps } = oppIds.length ? await supabase.from('opportunities').select('id, account_id').eq('org_id', org.org_id).in('id', oppIds) : { data: [] };
  const accountIds = [...new Set((opps ?? []).map((o) => (o as { account_id?: string }).account_id).filter(Boolean))] as string[];
  const { data: accounts } = accountIds.length ? await supabase.from('accounts').select('id, name').in('id', accountIds) : { data: [] };
  const leadName = new Map((leads ?? []).map((l) => [l.id, l.company || l.contact_name || 'Lead']));
  const accountName = new Map((accounts ?? []).map((a) => [a.id, a.name]));
  const oppToAccount = new Map((opps ?? []).map((o) => [(o as { id: string }).id, (o as { account_id?: string }).account_id]));
  const proposalAccountName = (p: { lead_id: string; opportunity_id?: string | null }) => {
    if (p.opportunity_id) {
      const accId = oppToAccount.get(p.opportunity_id);
      return accId ? accountName.get(accId) ?? '—' : '—';
    }
    return leadName.get(p.lead_id) ?? '—';
  };

  return (
    <SalesPageShell
      breadcrumb={
        <span className="text-muted-foreground">
          Sales <span className="text-foreground/80">/ Proposals</span>
        </span>
      }
    >
      <div className="mx-auto w-full max-w-[1400px] px-4 py-5 sm:px-6 sm:py-6 space-y-5">
        <PageHeader
          title={SALES_COPY.proposals.title}
          description={SALES_COPY.proposals.description}
          strap={SALES_COPY.proposals.strap}
          primaryCta={
            <Link href="/app/proposals/build">
              <Button size="sm" className="gap-2 h-9">
                <Plus className="h-4 w-4" />
                {SALES_COPY.proposals.newProposal}
              </Button>
            </Link>
          }
        />
        <div className="rounded-xl border border-border bg-card/80 dark:bg-card/90 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground py-3">Account</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground py-3">Amount</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground py-3">Status</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground py-3">Sent</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground py-3">Days open</TableHead>
                <TableHead className="w-32 py-3" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {!proposals?.length ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-10">
                    {SALES_COPY.proposals.noProposals}
                  </TableCell>
                </TableRow>
              ) : (
                proposals.map((p) => {
                  const sentAt = p.sent_at ? new Date(p.sent_at) : null;
                  const daysOpen = sentAt && (p.status === 'sent' || p.status === 'viewed') ? Math.floor((Date.now() - sentAt.getTime()) / 864e5) : null;
                  return (
                  <TableRow key={p.id} className="border-border hover:bg-muted/40">
                    <TableCell className="py-2.5 font-medium text-foreground">{proposalAccountName(p)}</TableCell>
                    <TableCell className="py-2.5 font-semibold tabular-nums text-foreground">{p.total_amount != null ? formatCurrency(Number(p.total_amount)) : '—'}</TableCell>
                    <TableCell className="py-2.5">
                      <Badge variant={p.status === 'accepted' ? 'default' : p.status === 'rejected' ? 'destructive' : 'outline'} className="text-[10px] font-medium uppercase tracking-wider capitalize">
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2.5 text-sm text-muted-foreground tabular-nums">{p.sent_at ? formatDate(p.sent_at) : '—'}</TableCell>
                    <TableCell className="py-2.5 text-sm tabular-nums text-muted-foreground">{daysOpen != null ? `${daysOpen}d` : '—'}</TableCell>
                    <TableCell className="py-2.5">
                      {p.status === 'accepted' && (
                        isCub ? (
                          p.opportunity_id ? (
                            <MarkAsWonButton opportunityId={p.opportunity_id} />
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )
                        ) : (
                          <Link href="/app/sales/launch-packets">
                            <Button variant="outline" size="sm" className="gap-1 h-8">
                              <Rocket className="h-3 w-3" />
                              {SALES_COPY.proposals.launchToOps}
                            </Button>
                          </Link>
                        )
                      )}
                    </TableCell>
                  </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </SalesPageShell>
  );
}
