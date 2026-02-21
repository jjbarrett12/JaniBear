'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';
import { getAppT } from '@/lib/app-translations';
import { 
  ClipboardCheck, 
  AlertCircle, 
  MapPin, 
  Users,
  FileText,
  Activity,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface ActivityItem {
  id: string;
  type: 'inspection' | 'issue' | 'location' | 'crew' | 'task' | 'template' | 'walkthrough';
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
  walkthrough: { icon: MapPin, color: 'bg-amber-100 text-amber-600' },
};

const statusColor: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-700',
  open: 'bg-red-100 text-red-700',
  pending: 'bg-amber-100 text-amber-700',
  closed: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
};

function translateAction(action: string, t: (k: import('@/lib/app-translations').AppTranslationKey) => string): string {
  if (action === 'Inspection completed') return t('inspectionCompleted');
  if (action === 'Inspection started') return t('inspectionStarted');
  if (action === 'Issue reported') return t('issueReported');
  return action;
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const { locale } = useLanguage();
  const t = getAppT(locale);

  const getStatusLabel = (status: string) => {
    if (status === 'completed') return t('statusDone');
    if (status === 'open') return t('statusOpen');
    if (status === 'pending') return t('statusPending');
    if (status === 'closed') return t('statusClosed');
    if (status === 'in_progress') return t('statusActive');
    return status;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.3 }}
    >
      <Card className="rounded-2xl border border-border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.3)] h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
              <Activity className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg font-semibold tracking-tight text-foreground">
              {t('recentActivity')}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {activities.length > 0 ? (
            <div className="space-y-1">
              {activities.slice(0, 6).map((activity, index) => {
                const config = activityConfig[activity.type] || activityConfig.task;
                const Icon = config.icon;
                const status = activity.status ? { label: getStatusLabel(activity.status), color: statusColor[activity.status] ?? 'bg-gray-100 text-gray-700' } : null;
                
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + index * 0.03 }}
                  >
                    <Link
                      href={activity.href}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <div className={`p-2 rounded-lg ${config.color} shrink-0`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {translateAction(activity.action, t)}
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
                        <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors" />
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
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('noRecentActivity')}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{t('noRecentActivitySub')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
