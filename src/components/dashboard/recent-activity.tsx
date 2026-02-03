'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/utils';
import { 
  ClipboardCheck, 
  AlertCircle, 
  MapPin, 
  Users,
  FileText,
  CheckCircle2,
  Activity,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface ActivityItem {
  id: string;
  type: 'inspection' | 'issue' | 'location' | 'crew' | 'task' | 'template' | 'proposal' | 'walkthrough';
  action: string;
  description: string;
  timestamp: string;
  href: string;
  status?: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

const activityConfig = {
  inspection: { icon: ClipboardCheck, color: 'bg-emerald-100 text-emerald-600' },
  issue: { icon: AlertCircle, color: 'bg-red-100 text-red-600' },
  location: { icon: MapPin, color: 'bg-blue-100 text-blue-600' },
  crew: { icon: Users, color: 'bg-violet-100 text-violet-600' },
  task: { icon: ClipboardCheck, color: 'bg-amber-100 text-amber-600' },
  template: { icon: FileText, color: 'bg-gray-100 text-gray-600' },
  proposal: { icon: FileText, color: 'bg-cyan-100 text-cyan-600' },
  walkthrough: { icon: MapPin, color: 'bg-orange-100 text-orange-600' },
};

const statusConfig = {
  completed: { label: 'Done', color: 'bg-emerald-100 text-emerald-700' },
  open: { label: 'Open', color: 'bg-red-100 text-red-700' },
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700' },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-700' },
  in_progress: { label: 'Active', color: 'bg-blue-100 text-blue-700' },
};

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.4 }}
    >
      <Card className="border-0 shadow-md hover:shadow-lg transition-shadow h-full dark:bg-gray-800">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 shadow-md">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Activity
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {activities.length > 0 ? (
            <div className="space-y-1">
              {activities.slice(0, 6).map((activity, index) => {
                const config = activityConfig[activity.type] || activityConfig.task;
                const Icon = config.icon;
                const status = activity.status ? statusConfig[activity.status as keyof typeof statusConfig] : null;
                
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.05 }}
                  >
                    <Link
                      href={activity.href}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                    >
                      <div className={`p-2 rounded-lg ${config.color} shrink-0`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                            {activity.action}
                          </p>
                          {status && (
                            <Badge variant="secondary" className={`${status.color} text-[10px] px-1.5 py-0`}>
                              {status.label}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {activity.description}
                        </p>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <span className="text-xs text-gray-400 hidden sm:block">
                          {formatRelativeTime(activity.timestamp)}
                        </span>
                        <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors" />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Activity className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">No recent activity</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Activity will appear here as you use JANIBEAR</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
