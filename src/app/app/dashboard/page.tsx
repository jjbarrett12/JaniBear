import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireOrg } from '@/lib/auth';
import { getUserContext, isFranchisor } from '@/lib/user-context';
import { isSalesRepRole } from '@/types/sales';
import { resolveShellForOrg } from '@/lib/shell';
import { PageLayout } from '@/components/enterprise';
import { CommandCenterHeader } from '@/components/dashboard/CommandCenterHeader';
import { DashboardWithExecutiveToggle } from '@/components/dashboard/DashboardWithExecutiveToggle';
import { DashboardDataProvider } from '@/contexts/dashboard-data-context';
import { getCommandCenterData } from '@/lib/command-center-data';
import { getDailyCommand } from '@/lib/daily-command-data';
import { DailyCommandOverview } from '@/components/daily/DailyCommandOverview';
import { getExecutiveMode } from '@/actions/executive-mode';
import { Award } from 'lucide-react';

export const revalidate = 60;

/**
 * Owner Command Center: daily control view with customizable widget layout.
 * Today section (view-powered) at top; then widgets: revenue, risk, crew, accounts, quality, AR, pipeline, AI.
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

  const [data, dailyPayload, executivePref] = await Promise.all([
    getCommandCenterData(org.org_id),
    getDailyCommand(org.org_id),
    getExecutiveMode(org.org_id),
  ]);
  const isFranchisee = context.orgType === 'franchisee';
  const isExecutiveEligible = ['owner', 'admin', 'manager'].includes((context.role ?? '').toLowerCase());

  return (
    <PageLayout>
      <DashboardDataProvider data={data}>
        <CommandCenterHeader
          userName={data.userName}
          subtitle="Here's what requires your attention today."
        />
        <section className="mb-6 rounded-xl border border-border bg-zinc-950 text-zinc-100 overflow-hidden">
          <DailyCommandOverview data={dailyPayload} embedded />
        </section>
        {isFranchisee && (
          <div className="rounded-2xl border border-border bg-muted/30 px-6 py-4 flex items-center justify-between gap-4 flex-wrap mb-6">
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
        )}

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
      </DashboardDataProvider>
    </PageLayout>
  );
}
