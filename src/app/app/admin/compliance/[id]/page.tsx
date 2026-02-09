import { redirect, notFound } from 'next/navigation';
import { requireOrg } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Edit,
  Calendar,
  MapPin,
  User,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default async function ComplianceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', org.org_id)
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
    .single();

  if (!member) {
    redirect('/app/dashboard');
  }

  const { data: record } = await supabase
    .from('compliance_records')
    .select('*, locations(name), employees(first_name, last_name)')
    .eq('id', params.id)
    .eq('org_id', org.org_id)
    .single();

  if (!record) {
    notFound();
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'compliant':
        return { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle };
      case 'non_compliant':
        return { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: XCircle };
      case 'in_progress':
        return { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: Clock };
      case 'expired':
        return { color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', icon: AlertCircle };
      default:
        return { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: AlertCircle };
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'high':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getTypeLabel = (type: string) =>
    type
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

  const statusStyle = getStatusStyle(record.status);
  const StatusIcon = statusStyle.icon;
  const isOverdue =
    record.due_date &&
    new Date(record.due_date) < new Date() &&
    !['compliant', 'non_compliant'].includes(record.status);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {record.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{getTypeLabel(record.type)}</p>
        </div>
        <Link href={`/app/admin/compliance/${record.id}/edit`}>
          <Button size="lg" className="h-12 w-full sm:w-auto">
            <Edit className="h-5 w-5 mr-2" />
            Edit
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge className={statusStyle.color}>
          <StatusIcon className="h-4 w-4 mr-1" />
          {record.status.replace('_', ' ')}
        </Badge>
        <Badge className={getPriorityStyle(record.priority)}>{record.priority}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {record.due_date && (
              <div
                className={
                  isOverdue
                    ? 'flex items-center gap-2 text-red-600 dark:text-red-400 font-medium'
                    : 'flex items-center gap-2 text-gray-600 dark:text-gray-400'
                }
              >
                <Calendar className="h-4 w-4 shrink-0" />
                Due: {formatDate(record.due_date)}
                {isOverdue && ' (Overdue)'}
              </div>
            )}
            {record.completion_date && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="h-4 w-4 shrink-0" />
                Completed: {formatDate(record.completion_date)}
              </div>
            )}
            {record.locations?.name && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <MapPin className="h-4 w-4 shrink-0" />
                {record.locations.name}
              </div>
            )}
            {record.employees && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <User className="h-4 w-4 shrink-0" />
                {record.employees.first_name} {record.employees.last_name}
              </div>
            )}
          </CardContent>
        </Card>

        {record.description && (
          <Card className="dark:bg-gray-800 dark:border-gray-700 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {record.description}
              </p>
            </CardContent>
          </Card>
        )}

        {record.ai_suggestions && (
          <Card className="md:col-span-2 dark:bg-gray-800 dark:border-gray-700 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-base text-blue-700 dark:text-blue-400">
                AI Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans">
                {typeof record.ai_suggestions === 'string'
                  ? record.ai_suggestions
                  : JSON.stringify(record.ai_suggestions, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="pt-4">
        <Link href="/app/admin/compliance">
          <Button variant="outline">Back to Compliance</Button>
        </Link>
      </div>
    </div>
  );
}
