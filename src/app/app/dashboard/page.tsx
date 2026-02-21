import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireOrg } from '@/lib/auth';
import { getUserContext, isFranchisor } from '@/lib/user-context';
import { isSalesRepRole } from '@/types/sales';
import { resolveShellForOrg } from '@/lib/shell';
import { PageLayout, ContentGrid, PrimaryPanel, ContextPanel } from '@/components/enterprise';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { TodaysSchedule } from '@/components/dashboard/todays-schedule';
import { InspectionChart } from '@/components/dashboard/charts/inspection-chart';
import { getOperatorDashboardData } from '@/lib/dashboard-data';
import { Award } from 'lucide-react';

/**
 * Dashboard: enterprise module structure — header, KPI row, 70/30 content grid.
 * Layout already ran requireOrg(); redirect franchisors / sales-rep as needed.
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
  const data = await getOperatorDashboardData(org.org_id);
  const safeData = {
    userName: data.userName,
    stats: data.stats,
    chartData: data.chartData,
    schedules: data.schedules,
    activities: data.activities,
  };

  const isFranchisee = context.orgType === 'franchisee';

  return (
    <PageLayout>
      <DashboardHeader
        userName={safeData.userName}
        subtitle={
          isFranchisee
            ? "Here's what's happening at your franchise location."
            : "Here's what's happening with your business today."
        }
      />
      {isFranchisee && (
        <div className="rounded-2xl border border-border bg-muted/30 px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
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
      <StatsCards stats={safeData.stats} />
      <QuickActions />
      <ContentGrid
        primary={
          <PrimaryPanel>
            <InspectionChart data={safeData.chartData} />
            <div className="grid gap-6 md:grid-cols-2">
              <TodaysSchedule items={safeData.schedules} />
            </div>
          </PrimaryPanel>
        }
        context={
          <ContextPanel>
            <RecentActivity activities={safeData.activities} />
          </ContextPanel>
        }
      />
    </PageLayout>
  );
}
