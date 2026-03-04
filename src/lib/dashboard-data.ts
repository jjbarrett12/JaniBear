/**
 * Shared dashboard data fetching for operator dashboards (owner-operator and franchisee).
 * Real data only — no sample/demo numbers. Cached 60s.
 */
import { unstable_cache } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';

export type DashboardStats = {
  openIssues: number;
  totalLocations: number;
  recentInspections: number;
  completedInspections: number;
  pendingTasks: number;
  totalCrews: number;
  avgScore?: number;
  totalIssues?: number;
  recentWalkthroughs?: number;
  timeframes?: {
    inspectionsLast7Days: number;
    inspectionsLast30Days: number;
    inspectionsPrevious30Days: number;
    openIssuesNow: number;
    issuesResolvedLast7Days: number;
    issuesOpenedLast7Days: number;
  };
};

export type ChartDataPoint = { date: string; score: number; count: number };
export type ScheduleItem = { id: string; location_name: string; crew_name: string | null; status: 'pending' | 'in_progress' | 'completed' };
export type ActivityItem = { id: string; type: 'inspection' | 'issue'; action: string; description: string; timestamp: string; href: string; status: string };

export type OperatorDashboardData = {
  stats: DashboardStats;
  chartData: ChartDataPoint[];
  schedules: ScheduleItem[];
  activities: ActivityItem[];
  userName: string;
};

const EMPTY_STATS: DashboardStats = {
  openIssues: 0,
  totalLocations: 0,
  recentInspections: 0,
  completedInspections: 0,
  pendingTasks: 0,
  totalCrews: 0,
  timeframes: {
    inspectionsLast7Days: 0,
    inspectionsLast30Days: 0,
    inspectionsPrevious30Days: 0,
    openIssuesNow: 0,
    issuesResolvedLast7Days: 0,
    issuesOpenedLast7Days: 0,
  },
};

const DASHBOARD_CACHE_REVALIDATE_SECONDS = 60;

export async function getOperatorDashboardData(orgId: string): Promise<OperatorDashboardData> {
  const user = await getCurrentUser();
  try {
    const data = await unstable_cache(
      async () => {
        const supabase = await createClient();
        return getOperatorDashboardDataInner(orgId, supabase);
      },
      ['operator-dashboard', orgId],
      { revalidate: DASHBOARD_CACHE_REVALIDATE_SECONDS }
    )();
    return { ...data, userName: user?.user_metadata?.full_name?.split(' ')[0] || 'there' };
  } catch (err) {
    console.error('getOperatorDashboardData failed:', err);
    return {
      ...EMPTY_STATS,
      chartData: [],
      schedules: [],
      activities: [],
      userName: user?.user_metadata?.full_name?.split(' ')[0] || 'there',
    };
  }
}

async function getOperatorDashboardDataInner(
  orgId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<Omit<OperatorDashboardData, 'userName'> & { userName: string }> {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();

    const [
      inspectionsResult,
      issuesResult,
      facilitiesResult,
      crewsResult,
      walkthroughsResult,
      schedulesResult,
      recentIssuesResult,
      inspectionScoresResult,
      inspectionsLast7Result,
      inspectionsLast30Result,
      inspectionsPrev30Result,
      issuesOpenedLast7Result,
      issuesResolvedLast7Result,
    ] = await Promise.all([
      supabase.from('inspections').select('*, facilities(name)').eq('org_id', orgId).order('created_at', { ascending: false }).limit(5),
      supabase.from('issues').select('*', { count: 'exact' }).eq('org_id', orgId).eq('status', 'open'),
      supabase.from('facilities').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
      supabase.from('crews').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
      supabase.from('walkthroughs').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
      supabase.from('schedules').select('id, facilities(name), crews(name), is_active').eq('org_id', orgId).eq('is_active', true).limit(5),
      supabase.from('issues').select('id, title, status, created_at').eq('org_id', orgId).order('created_at', { ascending: false }).limit(5),
      supabase.from('inspections').select('total_score, created_at').eq('org_id', orgId).not('total_score', 'is', null).order('created_at', { ascending: false }).limit(14),
      supabase.from('inspections').select('id', { count: 'exact', head: true }).eq('org_id', orgId).not('total_score', 'is', null).gte('created_at', sevenDaysAgo),
      supabase.from('inspections').select('id', { count: 'exact', head: true }).eq('org_id', orgId).not('total_score', 'is', null).gte('created_at', thirtyDaysAgo),
      supabase.from('inspections').select('id', { count: 'exact', head: true }).eq('org_id', orgId).not('total_score', 'is', null).gte('created_at', sixtyDaysAgo).lt('created_at', thirtyDaysAgo),
      supabase.from('issues').select('id', { count: 'exact', head: true }).eq('org_id', orgId).gte('created_at', sevenDaysAgo),
      supabase.from('issues').select('id', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'resolved').not('resolved_at', 'is', null).gte('resolved_at', sevenDaysAgo),
    ]);

    const recentInspections = inspectionsResult.data || [];
    const openIssuesCount = issuesResult.count ?? 0;
    const totalIssuesCount = (await supabase.from('issues').select('*', { count: 'exact', head: true }).eq('org_id', orgId)).count ?? 0;
    const locationsCount = facilitiesResult.count ?? 0;
    const crewsCount = crewsResult.count ?? 0;
    const walkthroughsCount = walkthroughsResult.count ?? 0;
    const todaysSchedules = schedulesResult.data || [];
    const recentIssues = recentIssuesResult.data || [];
    const inspectionScores = inspectionScoresResult.data || [];
    const completedInspectionsCount = (await supabase.from('inspections').select('*', { count: 'exact', head: true }).eq('org_id', orgId).not('total_score', 'is', null)).count ?? 0;
    const avgScore = inspectionScores.length > 0 ? inspectionScores.reduce((sum, i) => sum + (i.total_score || 0), 0) / inspectionScores.length : undefined;

    const formattedSchedules: ScheduleItem[] = todaysSchedules.map((s: { id: string; facilities?: { name: string } | null; crews?: { name: string } | null }) => ({
      id: s.id,
      location_name: (s.facilities as { name?: string } | null)?.name || 'Unknown Facility',
      crew_name: (s.crews as { name?: string } | null)?.name ?? null,
      status: 'pending' as const,
    }));

    const chartData: ChartDataPoint[] = inspectionScores.slice(0, 7).reverse().map((score: { created_at: string; total_score: number | null }) => ({
      date: new Date(score.created_at).toLocaleDateString('en-US', { weekday: 'short' }),
      score: score.total_score || 0,
      count: 1,
    }));

    const activities: ActivityItem[] = [];
    recentInspections.forEach((insp: { id: string; total_score: number | null; completed_at?: string; created_at: string; facilities?: { name?: string } | null }) => {
      activities.push({
        id: insp.id,
        type: 'inspection',
        action: insp.total_score !== null ? 'Inspection completed' : 'Inspection started',
        description: (insp.facilities as { name?: string } | null)?.name || 'Unknown Facility',
        timestamp: (insp as { completed_at?: string }).completed_at || insp.created_at || '',
        href: `/app/inspections/${insp.id}`,
        status: insp.total_score !== null ? 'completed' : 'pending',
      });
    });
    recentIssues.forEach((issue: { id: string; title: string | null; status: string; created_at: string }) => {
      activities.push({
        id: issue.id,
        type: 'issue',
        action: 'Issue reported',
        description: issue.title || '',
        timestamp: issue.created_at || '',
        href: `/app/issues/${issue.id}`,
        status: issue.status || 'open',
      });
    });
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const inspectionsLast7 = inspectionsLast7Result.count ?? 0;
    const inspectionsLast30 = inspectionsLast30Result.count ?? 0;
    const inspectionsPrev30 = inspectionsPrev30Result.count ?? 0;
    const issuesOpenedLast7 = issuesOpenedLast7Result.count ?? 0;
    const issuesResolvedLast7 = issuesResolvedLast7Result.count ?? 0;

    const stats: DashboardStats = {
      openIssues: openIssuesCount,
      totalLocations: locationsCount,
      recentInspections: recentInspections.length,
      completedInspections: completedInspectionsCount,
      pendingTasks: 0,
      totalCrews: crewsCount,
      avgScore,
      totalIssues: totalIssuesCount,
      recentWalkthroughs: walkthroughsCount,
      timeframes: {
        inspectionsLast7Days: inspectionsLast7,
        inspectionsLast30Days: inspectionsLast30,
        inspectionsPrevious30Days: inspectionsPrev30,
        openIssuesNow: openIssuesCount,
        issuesResolvedLast7Days: issuesResolvedLast7,
        issuesOpenedLast7Days: issuesOpenedLast7,
      },
    };

    return {
      stats,
      chartData,
      schedules: formattedSchedules,
      activities,
      userName: 'there',
    };
  } catch (err) {
    console.error('getOperatorDashboardData failed:', err);
    return {
      stats: EMPTY_STATS,
      chartData: [],
      schedules: [],
      activities: [],
      userName: 'there',
    };
  }
}
