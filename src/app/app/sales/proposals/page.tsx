import { createClient } from '@/lib/supabase/server';
import { requireOrg, getCurrentUserId } from '@/lib/auth';
import Link from 'next/link';
import { SalesPageShell } from '@/components/sales/page-shell';
import { PageHeader } from '@/components/sales/page-header';
import { Button } from '@/components/ui/button';
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
      <div className="p-4 md:p-6 space-y-6">
        <PageHeader
          title="Proposals"
          description="Sent proposals and status. When accepted, open Launch to Operations to hand off to Ops."
          primaryCta={
            <Link href="/app/proposals/build">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Proposal
              </Button>
            </Link>
          }
        />
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last sent</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-32" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {!proposals?.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No proposals yet. Build one from a walkthrough or scope.
                  </TableCell>
                </TableRow>
              ) : (
                proposals.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{proposalAccountName(p)}</TableCell>
                    <TableCell>{p.total_amount != null ? formatCurrency(Number(p.total_amount)) : '—'}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === 'accepted' ? 'default' : p.status === 'rejected' ? 'destructive' : 'outline'} className="capitalize">
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{p.sent_at ? formatDate(p.sent_at) : '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatDate(p.created_at)}</TableCell>
                    <TableCell>
                      {p.status === 'accepted' && (
                        isCub ? (
                          p.opportunity_id ? (
                            <MarkAsWonButton opportunityId={p.opportunity_id} />
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )
                        ) : (
                          <Link href="/app/sales/launch-packets">
                            <Button variant="outline" size="sm" className="gap-1">
                              <Rocket className="h-3 w-3" />
                              Launch to Operations
                            </Button>
                          </Link>
                        )
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </SalesPageShell>
  );
}
