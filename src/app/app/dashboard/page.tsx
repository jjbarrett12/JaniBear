import { createClient } from '@/lib/supabase/server';
import { requireOrg, getCurrentUser } from '@/lib/auth';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { TodaysSchedule } from '@/components/dashboard/todays-schedule';
import { InspectionChart } from '@/components/dashboard/charts/inspection-chart';

// Demo data for marketing screenshots (?demo=1)
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

export default async function DashboardPage(props: { searchParams?: Promise<{ demo?: string }> | { demo?: string } }) {
  const searchParams = typeof props.searchParams === 'object' && props.searchParams !== null && 'then' in props.searchParams
    ? await props.searchParams
    : (props.searchParams ?? {});
  const isDemo = searchParams?.demo === '1';

  const org = await requireOrg();
  const user = await getCurrentUser();
  const supabase = await createClient();

  // Parallel data fetching for better performance (skip when demo)
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
    // Recent inspections
    supabase
      .from('inspections')
      .select('*, locations(name)')
      .eq('org_id', org.org_id)
      .order('created_at', { ascending: false })
      .limit(5),
    
    // Issues
    supabase
      .from('issues')
      .select('*', { count: 'exact' })
      .eq('org_id', org.org_id)
      .eq('status', 'open'),
    
    // Locations
    supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', org.org_id),
    
    // Crews
    supabase
      .from('crews')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', org.org_id),
    
    // Recent walkthroughs
    supabase
      .from('walkthroughs')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', org.org_id),
    
    // Today's schedules
    supabase
      .from('schedules')
      .select('id, locations(name), crews(name), is_active')
      .eq('org_id', org.org_id)
      .eq('is_active', true)
      .limit(5),
    
    // Recent issues for activity
    supabase
      .from('issues')
      .select('id, title, status, created_at')
      .eq('org_id', org.org_id)
      .order('created_at', { ascending: false })
      .limit(5),
    
    // Inspection scores for chart
    supabase
      .from('inspections')
      .select('total_score, created_at')
      .eq('org_id', org.org_id)
      .not('total_score', 'is', null)
      .order('created_at', { ascending: false })
      .limit(14),
  ]);

  const recentInspections = inspectionsResult.data || [];
  const openIssuesCount = issuesResult.count || 0;
  const totalIssuesCount = (await supabase
    .from('issues')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', org.org_id)).count || 0;
  const locationsCount = locationsResult.count || 0;
  const crewsCount = crewsResult.count || 0;
  const walkthroughsCount = walkthroughsResult.count || 0;
  const todaysSchedules = schedulesResult.data || [];
  const recentIssues = recentIssuesResult.data || [];
  const inspectionScores = inspectionScoresResult.data || [];

  // Calculate completed inspections
  const completedInspectionsCount = (await supabase
    .from('inspections')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', org.org_id)
    .not('total_score', 'is', null)).count || 0;

  // Calculate average score
  const avgScore = inspectionScores.length > 0
    ? inspectionScores.reduce((sum, i) => sum + (i.total_score || 0), 0) / inspectionScores.length
    : undefined;

  // Format today's schedules
  const formattedSchedules = todaysSchedules.map((s: any) => ({
    id: s.id,
    location_name: s.locations?.name || 'Unknown Location',
    crew_name: s.crews?.name,
    status: 'pending' as const,
  }));

  // Prepare chart data
  const chartData = inspectionScores
    .slice(0, 7)
    .reverse()
    .map((score, index) => ({
      date: new Date(score.created_at).toLocaleDateString('en-US', { weekday: 'short' }),
      score: score.total_score || 0,
      count: 1,
    }));

  // Build activity feed
  type ActivityItem = { 
    id: string; 
    type: 'inspection' | 'issue'; 
    action: string; 
    description: string; 
    timestamp: string; 
    href: string; 
    status: string;
  };
  const activities: ActivityItem[] = [];

  recentInspections.forEach((insp: any) => {
    activities.push({
      id: insp.id,
      type: 'inspection',
      action: insp.total_score !== null ? 'Inspection completed' : 'Inspection started',
      description: insp.locations?.name || 'Unknown Location',
      timestamp: insp.completed_at || insp.created_at || '',
      href: `/app/inspections/${insp.id}`,
      status: insp.total_score !== null ? 'completed' : 'pending',
    });
  });

  recentIssues.forEach((issue: any) => {
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

  // Sort by timestamp
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Get user's name for greeting
  const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';

  // Override with demo data for marketing screenshots
  const stats = isDemo ? DEMO_STATS : {
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
  const finalChartData = isDemo ? DEMO_CHART_DATA : chartData;
  const finalSchedules = isDemo ? DEMO_SCHEDULE : formattedSchedules;
  const finalActivities = isDemo ? DEMO_ACTIVITIES : activities;

  return (
    <div className="space-y-6 pb-8">
      <DashboardHeader userName={userName} />

      {/* Stats Cards */}
      <StatsCards
        stats={stats}
      />

      {/* Quick Actions */}
      <QuickActions />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 space-y-6">
          <InspectionChart data={finalChartData} />
          
          {/* Pipeline and Schedule Row */}
          <div className="grid gap-6 md:grid-cols-2">
            <TodaysSchedule items={finalSchedules} />
          </div>
        </div>

        {/* Right Column - Activity */}
        <div className="lg:col-span-1">
          <RecentActivity activities={finalActivities} />
        </div>
      </div>
    </div>
  );
}
