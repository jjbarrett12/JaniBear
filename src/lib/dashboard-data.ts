/**
 * Shared dashboard data fetching for operator dashboards (owner-operator and franchisee).
 * Used by /app/dashboard/owner-operator and /app/dashboard/franchisee.
 */
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';

const DEMO_STATS = {
  openIssues: 3,
  totalLocations: 24,
  recentInspections: 5,
  completedInspections: 156,
  pendingTasks: 2,
  totalCrews: 8,
  avgScore: 94,
  totalIssues: 12,
  recentWalkthroughs: 18,
};

const DEMO_CHART_DATA = [
  { date: 'Mon', score: 88, count: 1 },
  { date: 'Tue', score: 92, count: 1 },
  { date: 'Wed', score: 91, count: 1 },
  { date: 'Thu', score: 95, count: 1 },
  { date: 'Fri', score: 94, count: 1 },
  { date: 'Sat', score: 96, count: 1 },
  { date: 'Sun', score: 94, count: 1 },
];

const DEMO_SCHEDULE = [
  { id: 'd1', location_name: 'Riverside Office Park – Bldg A', crew_name: 'Evening Crew Alpha', status: 'completed' as const },
  { id: 'd2', location_name: 'Tech Campus West', crew_name: 'Night Shift Bravo', status: 'in_progress' as const },
  { id: 'd3', location_name: 'Medical Plaza Suite 200', crew_name: 'Evening Crew Alpha', status: 'pending' as const },
  { id: 'd4', location_name: 'Downtown Financial Center', crew_name: 'Night Shift Bravo', status: 'pending' as const },
  { id: 'd5', location_name: 'Industrial Complex – Warehouse', crew_name: 'Weekend Team', status: 'pending' as const },
];

const DEMO_ACTIVITIES: Array<{ id: string; type: 'inspection' | 'issue'; action: string; description: string; timestamp: string; href: string; status: string }> = [
  { id: 'a1', type: 'inspection', action: 'Inspection completed', description: 'Riverside Office Park – Bldg A', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), href: '#', status: 'completed' },
  { id: 'a2', type: 'issue', action: 'Issue reported', description: 'Restroom dispenser low – 2nd floor', timestamp: new Date(Date.now() - 1000 * 60 * 42).toISOString(), href: '#', status: 'open' },
  { id: 'a3', type: 'inspection', action: 'Inspection completed', description: 'Tech Campus West', timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(), href: '#', status: 'completed' },
  { id: 'a4', type: 'inspection', action: 'Inspection started', description: 'Medical Plaza Suite 200', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), href: '#', status: 'pending' },
  { id: 'a5', type: 'issue', action: 'Issue reported', description: 'Spill in lobby – addressed', timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), href: '#', status: 'closed' },
];

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

export async function getOperatorDashboardData(
  orgId: string,
  options: { demo?: boolean } = {}
): Promise<OperatorDashboardData> {
  const explicitDemo = options.demo === true;
  const supabase = await createClient();
  const user = await getCurrentUser();

  const [
    inspectionsResult,
    issuesResult,
    locationsResult,
    crewsResult,
    walkthroughsResult,
    schedulesResult,
    recentIssuesResult,
    inspectionScoresResult,
  ] = await Promise.all([
    supabase.from('inspections').select('*, locations(name)').eq('org_id', orgId).order('created_at', { ascending: false }).limit(5),
    supabase.from('issues').select('*', { count: 'exact' }).eq('org_id', orgId).eq('status', 'open'),
    supabase.from('locations').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
    supabase.from('crews').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
    supabase.from('walkthroughs').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
    supabase.from('schedules').select('id, locations(name), crews(name), is_active').eq('org_id', orgId).eq('is_active', true).limit(5),
    supabase.from('issues').select('id, title, status, created_at').eq('org_id', orgId).order('created_at', { ascending: false }).limit(5),
    supabase.from('inspections').select('total_score, created_at').eq('org_id', orgId).not('total_score', 'is', null).order('created_at', { ascending: false }).limit(14),
  ]);

  const recentInspections = inspectionsResult.data || [];
  const openIssuesCount = issuesResult.count || 0;
  const totalIssuesCount = (await supabase.from('issues').select('*', { count: 'exact', head: true }).eq('org_id', orgId)).count || 0;
  const locationsCount = locationsResult.count || 0;
  const crewsCount = crewsResult.count || 0;
  const walkthroughsCount = walkthroughsResult.count || 0;
  const todaysSchedules = schedulesResult.data || [];
  const recentIssues = recentIssuesResult.data || [];
  const inspectionScores = inspectionScoresResult.data || [];
  const completedInspectionsCount = (await supabase.from('inspections').select('*', { count: 'exact', head: true }).eq('org_id', orgId).not('total_score', 'is', null)).count || 0;
  const avgScore = inspectionScores.length > 0 ? inspectionScores.reduce((sum, i) => sum + (i.total_score || 0), 0) / inspectionScores.length : undefined;

  const formattedSchedules: ScheduleItem[] = todaysSchedules.map((s: { id: string; locations?: { name: string } | null; crews?: { name: string } | null }) => ({
    id: s.id,
    location_name: (s.locations as { name?: string } | null)?.name || 'Unknown Location',
    crew_name: (s.crews as { name?: string } | null)?.name ?? null,
    status: 'pending' as const,
  }));

  const chartData: ChartDataPoint[] = inspectionScores.slice(0, 7).reverse().map((score: { created_at: string; total_score: number | null }) => ({
    date: new Date(score.created_at).toLocaleDateString('en-US', { weekday: 'short' }),
    score: score.total_score || 0,
    count: 1,
  }));

  const activities: ActivityItem[] = [];
  recentInspections.forEach((insp: { id: string; total_score: number | null; completed_at?: string; created_at: string; locations?: { name?: string } | null }) => {
    activities.push({
      id: insp.id,
      type: 'inspection',
      action: insp.total_score !== null ? 'Inspection completed' : 'Inspection started',
      description: (insp.locations as { name?: string } | null)?.name || 'Unknown Location',
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

  const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';
  const useSampleData = explicitDemo || (locationsCount <= 1 && completedInspectionsCount < 2);

  const stats: DashboardStats = useSampleData ? DEMO_STATS : {
    openIssues: openIssuesCount,
    totalLocations: locationsCount,
    recentInspections: recentInspections.length,
    completedInspections: completedInspectionsCount,
    pendingTasks: 0,
    totalCrews: crewsCount,
    avgScore,
    totalIssues: totalIssuesCount,
    recentWalkthroughs: walkthroughsCount,
  };

  return {
    stats,
    chartData: useSampleData ? DEMO_CHART_DATA : chartData,
    schedules: useSampleData ? DEMO_SCHEDULE : formattedSchedules,
    activities: useSampleData ? DEMO_ACTIVITIES : activities,
    userName,
  };
}
