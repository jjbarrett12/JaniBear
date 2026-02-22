import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { getUserContext } from '@/lib/user-context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Target, ListOrdered } from 'lucide-react';
import { SalesDataProvider } from '@/contexts/sales-data-context';
import { WidgetGrid } from '@/components/widgets/WidgetGrid';
import { salesWidgetRegistry } from '@/lib/widgets/registry/sales-widgets';

const STAGES = [
  'new',
  'contacted',
  'walkthrough_scheduled',
  'walkthrough_done',
  'proposal_sent',
  'won',
  'lost',
] as const;

export default async function SalesDashboardPage() {
  const org = await requireOrg();
  const { context } = await getUserContext();
  const supabase = await createClient();

  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('org_id', org.org_id)
    .order('created_at', { ascending: false });

  const byStage = STAGES.reduce<Record<string, typeof leads>>((acc, key) => {
    acc[key] = (leads || []).filter((l: { status?: string }) => l.status === key);
    return acc;
  }, {});

  const salesData = {
    leads: leads ?? [],
    byStage: byStage as Record<string, { id: string; contact_name?: string; company?: string; email?: string; phone?: string; status?: string; created_at?: string }[]>,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sales</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Lead → Walk-through</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/app/sales/cadence">
            <Button variant="outline" className="gap-2">
              <ListOrdered className="h-4 w-4" />
              10-Touch Cadence
            </Button>
          </Link>
          <Link href="/app/sales/top-targets">
            <Button variant="outline" className="gap-2">
              <Target className="h-4 w-4" />
              My Top 10
            </Button>
          </Link>
          <Link href="/app/sales/leads/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Lead
            </Button>
          </Link>
        </div>
      </div>

      <SalesDataProvider data={salesData}>
        <WidgetGrid
          moduleKey="sales_command_center"
          orgId={org.org_id}
          widgets={salesWidgetRegistry}
          header={null}
          role={context.role}
          roleEnum={context.roleEnum}
          isAdmin={['owner', 'admin', 'manager'].includes((context.role ?? '').toLowerCase())}
        />
      </SalesDataProvider>
    </div>
  );
}
