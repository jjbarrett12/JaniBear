import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, MapPin, Calendar, User } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default async function IssuesPage({
  searchParams,
}: {
  searchParams: { location?: string; inspection?: string; status?: string };
}) {
  const org = await requireOrg();
  const supabase = await createClient();

  let query = supabase
    .from('issues')
    .select('*, locations(name), profiles(full_name)')
    .eq('org_id', org.org_id);

  if (searchParams.location) {
    query = query.eq('location_id', searchParams.location);
  }
  if (searchParams.inspection) {
    query = query.eq('inspection_id', searchParams.inspection);
  }
  if (searchParams.status) {
    query = query.eq('status', searchParams.status);
  }

  const { data: issues } = await query.order('created_at', { ascending: false });

  const statusColors: Record<string, string> = {
    open: 'bg-red-100 text-red-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-800',
  };

  const severityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-800',
    med: 'bg-orange-100 text-orange-800',
    high: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Issues</h1>
          <p className="text-gray-600 mt-1">Track and resolve issues</p>
        </div>
        <div className="flex gap-2">
          <Link href="/app/issues?status=open">
            <Button variant={searchParams.status === 'open' ? 'default' : 'outline'}>
              Open
            </Button>
          </Link>
          <Link href="/app/issues?status=in_progress">
            <Button variant={searchParams.status === 'in_progress' ? 'default' : 'outline'}>
              In Progress
            </Button>
          </Link>
          <Link href="/app/issues?status=resolved">
            <Button variant={searchParams.status === 'resolved' ? 'default' : 'outline'}>
              Resolved
            </Button>
          </Link>
        </div>
      </div>

      {issues && issues.length > 0 ? (
        <div className="space-y-4">
          {issues.map((issue: any) => (
            <Link key={issue.id} href={`/app/issues/${issue.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                        <h3 className="text-lg font-semibold">{issue.title}</h3>
                      </div>
                      {issue.description && (
                        <p className="text-sm text-gray-600 mb-3">{issue.description}</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {issue.locations?.name}
                        </div>
                        {issue.assignee_user_id && (
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {issue.profiles?.full_name || 'Unassigned'}
                          </div>
                        )}
                        {issue.due_at && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Due: {formatDate(issue.due_at)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <span className={`px-2 py-1 rounded text-xs ${statusColors[issue.status]}`}>
                        {issue.status.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${severityColors[issue.severity]}`}>
                        {issue.severity}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No issues found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
