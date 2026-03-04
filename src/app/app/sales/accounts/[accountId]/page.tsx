import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Building2, FileSearch, FileText, Calculator } from 'lucide-react';
import { AccountSalesTabs } from '@/components/sales/account-sales-tabs';

export default async function SalesAccountDetailPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = await params;
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: account } = await supabase
    .from('accounts')
    .select('id, name, status, notes')
    .eq('id', accountId)
    .eq('org_id', org.org_id)
    .single();

  if (!account) notFound();

  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('id, stage, est_value, created_at')
    .eq('account_id', accountId)
    .eq('org_id', org.org_id)
    .order('created_at', { ascending: false });

  const oppIds = (opportunities ?? []).map((o) => o.id);
  const [walkthroughsRes, bidsRes, activitiesRes] = await Promise.all([
    oppIds.length
      ? supabase
          .from('walkthroughs')
          .select('id, status, scheduled_at, opportunity_id')
          .in('opportunity_id', oppIds)
          .eq('org_id', org.org_id)
          .order('scheduled_at', { ascending: false })
      : { data: [] },
    oppIds.length
      ? supabase
          .from('bids')
          .select('id, status, total_estimated_cost, opportunity_id, created_at')
          .in('opportunity_id', oppIds)
          .eq('org_id', org.org_id)
          .order('created_at', { ascending: false })
      : { data: [] },
    oppIds.length
      ? supabase
          .from('crm_activities')
          .select('id, type, subject, due_at, completed_at, created_at')
          .in('opportunity_id', oppIds)
          .eq('org_id', org.org_id)
          .order('created_at', { ascending: false })
          .limit(50)
      : { data: [] },
  ]);

  const walkthroughs = (walkthroughsRes.data ?? []) as { id: string; status: string; scheduled_at: string | null; opportunity_id: string | null }[];
  const bids = (bidsRes.data ?? []) as { id: string; status: string; total_estimated_cost: number | null; opportunity_id: string | null; created_at: string }[];
  const activities = (activitiesRes.data ?? []) as { id: string; type: string; subject: string | null; due_at: string | null; completed_at: string | null; created_at: string }[];
  const oppMap = new Map((opportunities ?? []).map((o) => [o.id, o]));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/app/sales/accounts">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="h-12 w-12 rounded-lg border border-border bg-muted flex items-center justify-center shrink-0">
            <Building2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{account.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={account.status === 'active' ? 'default' : 'secondary'}>
                {account.status === 'active' ? 'Active' : 'Prospect'}
              </Badge>
              <Link href={`/app/accounts/${account.id}`} className="text-sm text-primary hover:underline">
                Full account →
              </Link>
            </div>
          </div>
        </div>
      </div>

      <AccountSalesTabs
        accountId={account.id}
        accountName={account.name}
        opportunities={opportunities ?? []}
        walkthroughs={walkthroughs}
        bids={bids}
        activities={activities}
        oppMap={new Map((opportunities ?? []).map((o) => [o.id, o]))}
      />
    </div>
  );
}
