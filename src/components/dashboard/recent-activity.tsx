'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRelativeTime } from '@/lib/utils';
import { 
  ClipboardCheck, 
  AlertCircle, 
  MapPin, 
  Users,
  FileText,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import Link from 'next/link';

interface ActivityItem {
  id: string;
  type: 'inspection' | 'issue' | 'location' | 'crew' | 'task' | 'template';
  action: string;
  description: string;
  timestamp: string;
  href: string;
  status?: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

const activityIcons = {
  inspection: ClipboardCheck,
  issue: AlertCircle,
  location: MapPin,
  crew: Users,
  task: ClipboardCheck,
  template: FileText,
};

const statusColors = {
  completed: 'text-green-600',
  open: 'text-red-600',
  pending: 'text-amber-600',
  closed: 'text-gray-600',
};

export function RecentActivity({ activities }: RecentActivityProps) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-8">
            No recent activity to display
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.type] || ClipboardCheck;
            const statusColor = activity.status ? statusColors[activity.status as keyof typeof statusColors] : '';
            
            return (
              <Link
                key={activity.id}
                href={activity.href}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <Icon className="h-5 w-5 text-gray-600 group-hover:text-primary transition-colors" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.action}
                    </p>
                    {activity.status && (
                      <span className={`text-xs font-medium ${statusColor}`}>
                        {activity.status}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatRelativeTime(activity.timestamp)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t">
          <Link
            href="/app/activity"
            className="text-sm text-primary hover:underline font-medium block text-center"
          >
            View All Activity
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
