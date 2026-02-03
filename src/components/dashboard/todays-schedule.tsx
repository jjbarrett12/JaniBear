'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, Users, CheckCircle2 } from 'lucide-react';
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

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-gray-100 text-gray-700' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Done', color: 'bg-emerald-100 text-emerald-700' },
};

export function TodaysSchedule({ items }: TodaysScheduleProps) {
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric' 
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
    >
      <Card className="border-0 shadow-md hover:shadow-lg transition-shadow h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Today&apos;s Schedule
              </CardTitle>
              <p className="text-sm text-gray-500">{today}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length > 0 ? (
            items.slice(0, 5).map((item, index) => {
              const status = statusConfig[item.status];
              return (
                <Link key={item.id} href={`/app/schedules`}>
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group">
                    <div className={`mt-0.5 w-2 h-2 rounded-full ${item.status === 'completed' ? 'bg-emerald-500' : item.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                          {item.location_name}
                        </p>
                        <Badge variant="secondary" className={`${status.color} text-xs shrink-0`}>
                          {status.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
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
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 mb-1">No services scheduled today</p>
              <p className="text-xs text-gray-400">Add locations and create schedules</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
