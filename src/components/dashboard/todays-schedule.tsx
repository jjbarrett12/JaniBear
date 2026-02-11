'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/language-context';
import { getAppT } from '@/lib/app-translations';
import { Calendar, Clock, Users } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface ScheduleItem {
  id: string;
  location_name: string;
  crew_name?: string;
  time?: string;
  status: 'pending' | 'in_progress' | 'completed';
}

interface TodaysScheduleProps {
  items: ScheduleItem[];
}

const statusColor: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
};

export function TodaysSchedule({ items }: TodaysScheduleProps) {
  const { locale } = useLanguage();
  const t = getAppT(locale);
  const today = new Date().toLocaleDateString(locale === 'es' ? 'es' : 'en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
  const getStatusLabel = (status: string) => {
    if (status === 'pending') return t('statusPending');
    if (status === 'in_progress') return t('statusInProgress');
    if (status === 'completed') return t('statusDone');
    return status;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.3 }}
    >
      <Card className="rounded-xl border-0 shadow-sm hover:shadow-md transition-shadow h-full bg-card">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('todaysSchedule')}
              </CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">{today}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length > 0 ? (
            items.slice(0, 5).map((item) => {
              const color = statusColor[item.status] ?? 'bg-gray-100 text-gray-700';
              return (
                <Link key={item.id} href="/app/schedules">
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                    <div className={`mt-0.5 w-2 h-2 rounded-full ${item.status === 'completed' ? 'bg-emerald-500' : item.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {item.location_name}
                        </p>
                        <Badge variant="secondary" className={`${color} text-xs shrink-0`}>
                          {getStatusLabel(item.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {item.crew_name && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {item.crew_name}
                          </span>
                        )}
                        {item.time && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {item.time}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="text-center py-6">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('noServicesScheduled')}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{t('noServicesScheduledSub')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
