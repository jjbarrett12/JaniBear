import { redirect } from 'next/navigation';
import { requireOrg } from '@/lib/auth';
import { getUserContext } from '@/lib/user-context';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { TodaysSchedule } from '@/components/dashboard/todays-schedule';
import { InspectionChart } from '@/components/dashboard/charts/inspection-chart';
import { getOperatorDashboardData } from '@/lib/dashboard-data';

export default async function OwnerOperatorDashboardPage() {
  const { context } = await getUserContext();
  if (context.orgType === 'franchisee') redirect('/app/dashboard/franchisee');
  if (context.orgType === 'franchisor') redirect('/franchisor');

  const org = await requireOrg();
  const data = await getOperatorDashboardData(org.org_id);

  return (
    <div className="space-y-6 pb-8">
      <DashboardHeader
        userName={data.userName}
        subtitle="Here's what's happening with your business today."
      />
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
