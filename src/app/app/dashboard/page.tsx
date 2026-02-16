import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireOrg } from '@/lib/auth';
import { getUserContext, isFranchisor } from '@/lib/user-context';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { TodaysSchedule } from '@/components/dashboard/todays-schedule';
import { InspectionChart } from '@/components/dashboard/charts/inspection-chart';
import { getOperatorDashboardData } from '@/lib/dashboard-data';
import { Award } from 'lucide-react';

/**
 * Dashboard: render correct content in one response to avoid redirect reload.
 * Only redirect when necessary (no org → landing; franchisor → /franchisor).
 */
export default async function DashboardPage(props: {
  searchParams?: Promise<{ demo?: string }> | { demo?: string };
}) {
  const { context } = await getUserContext();
  if (!context.activeOrgId) redirect('/api/auth/landing');

  if (isFranchisor(context)) {
    redirect('/franchisor');
  }

  const org = await requireOrg();
  const searchParams =
    typeof props.searchParams === 'object' && props.searchParams !== null && 'then' in props.searchParams
      ? await props.searchParams
      : (props.searchParams ?? {});
  const explicitDemo = (searchParams as { demo?: string })?.demo === '1';
  const data = await getOperatorDashboardData(org.org_id, { demo: explicitDemo });

  const isFranchisee = context.orgType === 'franchisee';

  return (
    <div className="space-y-6 pb-8">
      <DashboardHeader
        userName={data.userName}
        subtitle={
          isFranchisee
            ? "Here's what's happening at your franchise location."
            : "Here's what's happening with your business today."
        }
      />
      {isFranchisee && (
        <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm text-muted-foreground">
            You&apos;re viewing your franchise location. Compare outcomes and optional standards in KPI Dashboard and Financial Health.
          </p>
          <Link
            href="/app/templates"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <Award className="h-4 w-4" />
            View suggested brand standards
          </Link>
        </div>
      )}
      <StatsCards stats={data.stats} />
      <QuickActions />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <InspectionChart data={data.chartData} />
          <div className="grid gap-6 md:grid-cols-2">
            <TodaysSchedule items={data.schedules} />
          </div>
        </div>
        <div className="lg:col-span-1">
          <RecentActivity activities={data.activities} />
        </div>
      </div>
    </div>
  );
}
