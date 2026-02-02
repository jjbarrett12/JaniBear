import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { ClipboardCheck, AlertCircle, MapPin, TrendingUp, Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

export default async function DashboardPage() {
  const org = await requireOrg();
  const supabase = await createClient();

  // Get recent inspections
  const { data: recentInspections } = await supabase
    .from('inspections')
    .select('*, locations(name)')
    .eq('org_id', org.org_id)
    .order('created_at', { ascending: false })
    .limit(5);

  // Get open issues count
  const { count: openIssuesCount } = await supabase
    .from('issues')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', org.org_id)
    .eq('status', 'open');

  // Get locations count
  const { count: locationsCount } = await supabase
    .from('locations')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', org.org_id);

  // Get crews count
  const { count: crewsCount } = await supabase
    .from('crews')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', org.org_id);

  // Get pending tasks count
  const { count: pendingTasksCount } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', org.org_id)
    .eq('status', 'pending');

  // Get total issues count
  const { count: totalIssuesCount } = await supabase
    .from('issues')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', org.org_id);

  // Get completed inspections count
  const { count: completedInspectionsCount } = await supabase
    .from('inspections')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', org.org_id)
    .not('total_score', 'is', null);

  // Calculate average score from recent inspections
  const { data: scoreData } = await supabase
    .from('inspections')
    .select('total_score')
    .eq('org_id', org.org_id)
    .not('total_score', 'is', null)
    .order('created_at', { ascending: false })
    .limit(10);

  const avgScore = scoreData && scoreData.length > 0
    ? scoreData.reduce((sum, i) => sum + (i.total_score || 0), 0) / scoreData.length
    : null;

  // Get recent activity
  type ActivityItem = { id: string; type: 'inspection' | 'issue'; action: string; description: string; timestamp: string; href: string; status: string };
  const activities: ActivityItem[] = [];

  // Recent inspections
  if (recentInspections) {
    recentInspections.forEach((insp: { id: string; locations?: { name?: string }; completed_at?: string; created_at?: string; total_score?: number | null }) => {
      activities.push({
        id: insp.id,
        type: 'inspection' as const,
        action: 'Inspection completed',
        description: `${insp.locations?.name || 'Unknown Location'}`,
        timestamp: insp.completed_at || insp.created_at || '',
        href: `/app/inspections/${insp.id}`,
        status: insp.total_score !== null ? 'completed' : 'pending',
      });
    });
  }

  // Recent issues
  const { data: recentIssues } = await supabase
    .from('issues')
    .select('id, title, status, created_at')
    .eq('org_id', org.org_id)
    .order('created_at', { ascending: false })
    .limit(5);

  if (recentIssues) {
    recentIssues.forEach((issue) => {
      activities.push({
        id: issue.id,
        type: 'issue' as const,
        action: 'Issue created',
        description: issue.title ?? '',
        timestamp: issue.created_at ?? '',
        href: `/app/issues/${issue.id}`,
        status: issue.status ?? 'pending',
      });
    });
  }

  // Sort by timestamp and limit
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const recentActivities = activities.slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back to Janibear</p>
      </div>

      <StatsCards
        stats={{
          openIssues: openIssuesCount || 0,
          totalLocations: locationsCount || 0,
          recentInspections: recentInspections?.length || 0,
          completedInspections: completedInspectionsCount || 0,
          pendingTasks: pendingTasksCount || 0,
          totalCrews: crewsCount || 0,
          avgScore: avgScore || undefined,
          totalIssues: totalIssuesCount || undefined,
        }}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Inspections</CardTitle>
            <Link href="/app/inspections/start">
              <Button size="lg" variant="outline" className="h-12">
                <Plus className="h-5 w-5 mr-2" />
                New Inspection
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentInspections && recentInspections.length > 0 ? (
              <div className="space-y-4">
                {recentInspections.map((inspection: any) => (
                  <Link key={inspection.id} href={`/app/inspections/${inspection.id}`}>
                    <div className="flex items-center justify-between border-b pb-4 last:border-0 hover:bg-gray-50 p-2 rounded-lg transition-colors cursor-pointer">
                      <div>
                        <p className="font-medium">{inspection.locations?.name || 'Unknown Location'}</p>
                        <p className="text-sm text-gray-600">
                          {formatDate(inspection.created_at)}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        {inspection.total_score !== null ? (
                          <p className="font-semibold">{inspection.total_score.toFixed(1)}%</p>
                        ) : (
                          <p className="text-sm text-gray-500">In Progress</p>
                        )}
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No inspections yet</p>
                <Link href="/app/inspections/start">
                  <Button size="lg" className="h-14 text-lg">
                    <Plus className="h-5 w-5 mr-2" />
                    Start Your First Inspection
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Link href="/app/locations/new">
                <Button variant="outline" className="w-full justify-start h-14 text-base">
                  <Plus className="h-5 w-5 mr-3" />
                  Add New Location
                </Button>
              </Link>
              <Link href="/app/inspections/start">
                <Button variant="outline" className="w-full justify-start h-14 text-base">
                  <ClipboardCheck className="h-5 w-5 mr-3" />
                  Start Inspection
                </Button>
              </Link>
              <Link href="/app/crews/new">
                <Button variant="outline" className="w-full justify-start h-14 text-base">
                  <Plus className="h-5 w-5 mr-3" />
                  Create Crew
                </Button>
              </Link>
              <Link href="/app/schedules/new">
                <Button variant="outline" className="w-full justify-start h-14 text-base">
                  <Plus className="h-5 w-5 mr-3" />
                  Create Schedule
                </Button>
              </Link>
              <Link href="/app/walkthroughs/new">
                <Button variant="outline" className="w-full justify-start h-14 text-base">
                  <Plus className="h-5 w-5 mr-3" />
                  New Walkthrough
                </Button>
              </Link>
              <Link href="/app/crm/clients/new">
                <Button variant="outline" className="w-full justify-start h-14 text-base">
                  <Plus className="h-5 w-5 mr-3" />
                  Add Client
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <RecentActivity activities={recentActivities} />
      </div>
    </div>
  );
}
