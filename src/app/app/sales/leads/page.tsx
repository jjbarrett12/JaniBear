import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import Link from 'next/link';
import { SalesPageShell } from '@/components/sales/page-shell';
import { PageHeader } from '@/components/sales/page-header';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { LeadsTableWithDrawer } from '@/components/sales/leads-table-with-drawer';

export default async function SalesLeadsPage() {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: leads } = await supabase
    .from('leads')
    .select('id, contact_name, company, source, status, created_at, updated_at, converted_opportunity_id')
    .eq('org_id', org.org_id)
    .order('created_at', { ascending: false });

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
      <div className="p-4 md:p-6 space-y-6">
        <PageHeader
          title="Leads"
          description="Unqualified contacts — convert to Opportunity to move into Pipeline."
          primaryCta={
            <Link href="/app/sales/leads/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Lead
              </Button>
            </Link>
          }
        />
        <LeadsTableWithDrawer
          leads={leads ?? []}
          accounts={accounts ?? []}
          orgId={org.org_id}
        />
      </div>
    </SalesPageShell>
  );
}
