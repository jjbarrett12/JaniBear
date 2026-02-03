import { createClient } from '@/lib/supabase/server';
import { requireOrg, getCurrentUser } from '@/lib/auth';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { PipelineWidget } from '@/components/dashboard/pipeline-widget';
import { TodaysSchedule } from '@/components/dashboard/todays-schedule';
import { InspectionChart } from '@/components/dashboard/charts/inspection-chart';

export default async function DashboardPage() {
  const org = await requireOrg();
  const user = await getCurrentUser();
  const supabase = await createClient();

  // Parallel data fetching for better performance
  const [
    inspectionsResult,
    issuesResult,
    locationsResult,
    crewsResult,
    proposalsResult,
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
    
    // Proposals
    supabase
      .from('proposals')
      .select('id, total_amount, status, created_at, leads(full_name, company_name)')
      .eq('org_id', org.org_id)
      .in('status', ['draft', 'sent'])
      .order('created_at', { ascending: false })
      .limit(10),
    
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
  const proposals = proposalsResult.data || [];
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

  // Calculate pipeline value
  const pipelineValue = proposals.reduce((sum, p) => sum + (p.total_amount || 0), 0);

  // Format proposals for widget
  const formattedProposals = proposals.map((p: any) => ({
    id: p.id,
    lead_name: p.leads?.full_name || 'Unknown',
    company_name: p.leads?.company_name,
    total_amount: p.total_amount || 0,
    status: p.status,
    created_at: p.created_at,
  }));

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

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Welcome back, {userName}
          </h1>
          <p className="text-gray-500 mt-1">
            Here&apos;s what&apos;s happening with your business today
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="hidden md:inline">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards
        stats={{
          openIssues: openIssuesCount,
          totalLocations: locationsCount,
          recentInspections: recentInspections.length,
          completedInspections: completedInspectionsCount,
          pendingTasks: 0,
          totalCrews: crewsCount,
          avgScore,
          totalIssues: totalIssuesCount,
          pendingProposals: proposals.length,
          proposalValue: pipelineValue,
          recentWalkthroughs: walkthroughsCount,
        }}
      />

      {/* Quick Actions */}
      <QuickActions />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 space-y-6">
          <InspectionChart data={chartData} />
          
          {/* Pipeline and Schedule Row */}
          <div className="grid gap-6 md:grid-cols-2">
            <PipelineWidget 
              proposals={formattedProposals} 
              totalValue={pipelineValue} 
            />
            <TodaysSchedule items={formattedSchedules} />
          </div>
        </div>

        {/* Right Column - Activity */}
        <div className="lg:col-span-1">
          <RecentActivity activities={activities} />
        </div>
      </div>
    </div>
  );
}
