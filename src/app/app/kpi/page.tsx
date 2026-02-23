import { requireOrg } from '@/lib/auth';
import { getUserContext } from '@/lib/user-context';
import { getKpiSummary } from '@/actions/kpi-command-center';
import { redirect } from 'next/navigation';
import { KpiCommandCenterContent } from '@/components/kpi/KpiCommandCenterContent';

export const dynamic = 'force-dynamic';

export default async function KpiCommandCenterPage() {
  const org = await requireOrg();
  const { context } = await getUserContext();
  const canView = ['owner', 'admin', 'manager'].includes((context.role ?? '').toLowerCase()) || context.capabilities?.['view_kpis'];
  if (!canView) redirect('/app/dashboard');

  const summary = await getKpiSummary(org.org_id);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/50 px-4 py-6">
        <div className="max-w-[1400px] mx-auto">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Performance Command Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Strategic KPIs. Trends and benchmarks. Org-scoped.
          </p>
        </div>
      </div>
      <div className="p-4 md:p-6">
        <KpiCommandCenterContent summary={summary} />
      </div>
    </div>
  );
}
