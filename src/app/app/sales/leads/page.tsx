import { createClient } from '@/lib/supabase/server';
import { requireOrg, getCurrentUserId } from '@/lib/auth';
import Link from 'next/link';
import { SalesPageShell } from '@/components/sales/page-shell';
import { PageHeader } from '@/components/sales/page-header';
import { Button } from '@/components/ui/button';
import { Plus, AlertCircle } from 'lucide-react';
import { LeadsTableWithDrawer } from '@/components/sales/leads-table-with-drawer';
import { LeadsSavedViewTabs } from '@/components/sales/leads-saved-view-tabs';
import type { LeadSavedViewKey } from '@/lib/sales/types';
import { SALES_COPY } from '@/lib/sales-module-copy';

type PageProps = { searchParams: Promise<{ overflow?: string; view?: string }> };

export default async function SalesLeadsPage({ searchParams }: PageProps) {
  const org = await requireOrg();
  const userId = await getCurrentUserId();
  const supabase = await createClient();
  const params = await searchParams;
  const overflowOnly = params.overflow === 'true';
  const view = (params.view as LeadSavedViewKey | undefined) || 'my_new_leads';

  let query = supabase
    .from('leads')
    .select('id, contact_name, company, source, status, created_at, updated_at, converted_opportunity_id, overflow, overflow_reason, assigned_user_id, assigned_to, lead_score, next_follow_up_at, import_batch_id, first_touched_at, is_possible_duplicate')
    .eq('org_id', org.org_id);

  if (overflowOnly) {
    query = query.eq('overflow', true);
  } else {
    switch (view) {
      case 'my_new_leads':
        if (userId) query = query.or(`assigned_user_id.eq.${userId},assigned_to.eq.${userId}`);
        query = query.in('status', ['new', 'enriched']).is('converted_opportunity_id', null);
        break;
      case 'hot_leads':
        query = query.gte('lead_score', 70).is('converted_opportunity_id', null);
        break;
      case 'needs_first_touch':
        query = query.is('first_touched_at', null).is('converted_opportunity_id', null).in('status', ['new', 'enriched']);
        break;
      case 'needs_follow_up':
        query = query.not('next_follow_up_at', 'is', null).lte('next_follow_up_at', new Date().toISOString());
        break;
      case 'ready_for_walkthrough':
        query = query.eq('status', 'qualified').is('converted_opportunity_id', null);
        break;
      case 'unworked_imports':
        query = query.not('import_batch_id', 'is', null).in('status', ['new', 'enriched']);
        break;
      case 'high_value_targets':
        query = query.is('converted_opportunity_id', null);
        break;
      case 'referrals':
        query = query.in('source', ['referral', 'existing_customer_referral']).is('converted_opportunity_id', null);
        break;
      case 'possible_duplicates':
        query = query.eq('is_possible_duplicate', true);
        break;
      default:
        if (userId) query = query.or(`assigned_user_id.eq.${userId},assigned_to.eq.${userId}`);
    }
  }

  if (view === 'high_value_targets') {
    query = query.order('lead_score', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data: leads } = await query;

  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, name')
    .eq('org_id', org.org_id)
    .order('name')
    .limit(200);

  return (
    <SalesPageShell
      breadcrumb={
        <span className="text-muted-foreground">
          Sales <span className="text-foreground/80">/ Leads</span>
        </span>
      }
    >
      <div className="mx-auto w-full max-w-[1400px] px-4 py-5 sm:px-6 sm:py-6 space-y-5">
        <PageHeader
          title={SALES_COPY.leads.title}
          description={SALES_COPY.leads.description}
          strap={SALES_COPY.leads.strap}
          primaryCta={
            <div className="flex items-center gap-2">
              {!overflowOnly && (
                <Link href="/app/sales/leads?overflow=true">
                  <Button variant="outline" size="sm" className="gap-2 h-9">
                    <AlertCircle className="h-4 w-4" />
                    {SALES_COPY.leads.overflowQueue}
                  </Button>
                </Link>
              )}
              <Link href="/app/sales/leads/new">
                <Button size="sm" className="gap-2 h-9">
                  <Plus className="h-4 w-4" />
                  {SALES_COPY.leads.newLead}
                </Button>
              </Link>
            </div>
          }
        />
        {!overflowOnly && <LeadsSavedViewTabs currentView={view} />}
        <LeadsTableWithDrawer
          leads={leads ?? []}
          accounts={accounts ?? []}
          orgId={org.org_id}
          overflowMode={overflowOnly}
        />
      </div>
    </SalesPageShell>
  );
}
