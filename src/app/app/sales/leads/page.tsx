import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import Link from 'next/link';
import { SalesPageShell } from '@/components/sales/page-shell';
import { PageHeader } from '@/components/sales/page-header';
import { Button } from '@/components/ui/button';
import { Plus, AlertCircle } from 'lucide-react';
import { LeadsTableWithDrawer } from '@/components/sales/leads-table-with-drawer';

type PageProps = { searchParams: Promise<{ overflow?: string }> };

export default async function SalesLeadsPage({ searchParams }: PageProps) {
  const org = await requireOrg();
  const supabase = await createClient();
  const params = await searchParams;
  const overflowOnly = params.overflow === 'true';

  let query = supabase
    .from('leads')
    .select('id, contact_name, company, source, status, created_at, updated_at, converted_opportunity_id, overflow, overflow_reason, assigned_user_id')
    .eq('org_id', org.org_id)
    .order('created_at', { ascending: false });
  if (overflowOnly) query = query.eq('overflow', true);
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
      <div className="p-4 md:p-6 space-y-6">
        <PageHeader
          title="Leads"
          description="Unqualified contacts — convert to Opportunity to move into Pipeline."
          primaryCta={
            <div className="flex items-center gap-2">
              {!overflowOnly && (
                <Link href="/app/sales/leads?overflow=true">
                  <Button variant="outline" className="gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Overflow Queue
                  </Button>
                </Link>
              )}
              <Link href="/app/sales/leads/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Lead
                </Button>
              </Link>
            </div>
          }
        />
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
