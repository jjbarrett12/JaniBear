import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Calendar, MapPin, FileText, Users } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default async function SchedulesPage() {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: schedules } = await supabase
    .from('schedules')
    .select('*, locations(name), templates(name), crews(name)')
    .eq('org_id', org.org_id)
    .order('start_date', { ascending: false });

  // Generate next 14 days of occurrences for each schedule
  const today = new Date();
  const next14Days = Array.from({ length: 14 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    return date;
  });

  const upcomingOccurrences = schedules?.flatMap((schedule: any) => {
    if (!schedule.is_active) return [];
    
    const occurrences: any[] = [];
    const startDate = new Date(schedule.start_date);
    
    if (schedule.recurrence === 'none') {
      if (startDate >= today && startDate <= next14Days[next14Days.length - 1]) {
        occurrences.push({
          schedule_id: schedule.id,
          due_at: startDate,
          schedule,
        });
      }
    } else if (schedule.recurrence === 'weekly' && schedule.weekday !== null) {
      next14Days.forEach((date) => {
        if (date.getDay() === schedule.weekday && date >= startDate) {
          occurrences.push({
            schedule_id: schedule.id,
            due_at: date,
            schedule,
          });
        }
      });
    }
    
    return occurrences;
  }).sort((a, b) => a.due_at.getTime() - b.due_at.getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Schedules</h1>
          <p className="text-gray-600 mt-1">Manage inspection schedules and assignments</p>
        </div>
        <Link href="/app/schedules/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Schedule
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>All Schedules</CardTitle>
          </CardHeader>
          <CardContent>
            {schedules && schedules.length > 0 ? (
              <div className="space-y-3">
                {schedules.map((schedule: any) => (
                  <Link
                    key={schedule.id}
                    href={`/app/schedules/${schedule.id}`}
                    className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{schedule.locations?.name}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{schedule.templates?.name}</span>
                        </div>
                        {schedule.crews && (
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{schedule.crews.name}</span>
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-2">
                          {schedule.recurrence === 'weekly' 
                            ? `Weekly on ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][schedule.weekday || 0]}`
                            : `One-time on ${formatDate(schedule.start_date)}`
                          }
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        schedule.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {schedule.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No schedules yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming (Next 14 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingOccurrences && upcomingOccurrences.length > 0 ? (
              <div className="space-y-3">
                {upcomingOccurrences.map((occ: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="font-medium">{formatDate(occ.due_at)}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div>{occ.schedule.locations?.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {occ.schedule.templates?.name}
                      </div>
                    </div>
                    <Link href={`/app/inspections/start?schedule=${occ.schedule_id}&date=${occ.due_at.toISOString().split('T')[0]}`}>
                      <Button size="sm" className="mt-2 w-full">
                        Start Inspection
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No upcoming inspections</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
