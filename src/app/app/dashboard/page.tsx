import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireOrg } from '@/lib/auth';
import { getUserContext, isFranchisor } from '@/lib/user-context';
import { isSalesRepRole } from '@/types/sales';
import { resolveShellForOrg } from '@/lib/shell';
import { PageLayout } from '@/components/enterprise';
import { DashboardDataProvider } from '@/contexts/dashboard-data-context';
import { getCommandCenterData } from '@/lib/command-center-data';
import { getExecutiveMode } from '@/actions/executive-mode';
import { CockpitSection } from './components/CockpitSection';
import { DashboardWithExecutiveToggle } from '@/components/dashboard/DashboardWithExecutiveToggle';
import { Award } from 'lucide-react';

export const revalidate = 60;

/**
 * Executive Command Center: header band, 6-tile KPI strip, alert rail, main cockpit grid (2/3 ops + 1/3 attention).
 * Data from getCommandCenterData; KPIs normalized via cockpit-data adapter.
 */
export default async function DashboardPage() {
  const org = await requireOrg();
  const shell = await resolveShellForOrg(org.org_id);
  if (shell === 'franchisor') {
    redirect('/app/franchise');
  }
  const { context } = await getUserContext();

  if (isFranchisor(context)) {
    redirect('/app/franchise');
  }
  if (isSalesRepRole(context.role, context.roleEnum)) {
    redirect('/app/sales-dashboard');
  }

  const [data, executivePref] = await Promise.all([
    getCommandCenterData(org.org_id),
    getExecutiveMode(org.org_id),
  ]);
  const isFranchisee = context.orgType === 'franchisee';
  const isExecutiveEligible = ['owner', 'admin', 'manager'].includes((context.role ?? '').toLowerCase());

  return (
    <PageLayout>
      <DashboardDataProvider data={data}>
        <CockpitSection orgId={org.org_id} />
        {isFranchisee && (
          <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 mt-5 sm:mt-6">
            <div className="rounded-xl border border-border bg-muted/30 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm text-muted-foreground">
              You&apos;re viewing your franchise location. Compare outcomes and optional standards in KPI Dashboard and Financial Health.
            </p>
            <Link
              href="/app/templates"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <Award className="h-4 w-4 shrink-0" />
              View suggested brand standards
            </Link>
            </div>
          </div>
        )}

        <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 mt-5 sm:mt-6">
          <DashboardWithExecutiveToggle
            orgId={org.org_id}
            initialExecutiveMode={executivePref.enabled}
            isExecutiveEligible={isExecutiveEligible}
            widgetGridProps={{
              moduleKey: 'dashboard',
              role: context.role,
              roleEnum: context.roleEnum,
              isAdmin: isExecutiveEligible,
            }}
          />
        </div>
      </DashboardDataProvider>
    </PageLayout>
  );
}
