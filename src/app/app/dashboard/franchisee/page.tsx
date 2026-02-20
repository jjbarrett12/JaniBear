import { redirect } from 'next/navigation';
import { requireOrg } from '@/lib/auth';
import { getUserContext } from '@/lib/user-context';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { TodaysSchedule } from '@/components/dashboard/todays-schedule';
import { InspectionChart } from '@/components/dashboard/charts/inspection-chart';
import { getOperatorDashboardData } from '@/lib/dashboard-data';
import { Award } from 'lucide-react';

export default async function FranchiseeDashboardPage() {
  const { context } = await getUserContext();
  if (context.orgType === 'independent' || context.orgType === null) redirect('/app/dashboard/owner-operator');
  if (context.orgType === 'franchisor') redirect('/franchisor');

  const org = await requireOrg();
  const data = await getOperatorDashboardData(org.org_id);

  return (
    <div className="space-y-6 pb-8">
      <DashboardHeader
        userName={data.userName}
        subtitle="Here&#39;s what&#39;s happening at your franchise location."
      />
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
