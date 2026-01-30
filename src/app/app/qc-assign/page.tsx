'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ListChecks, Users, Calendar, Loader2, Check } from 'lucide-react';

interface Schedule {
  id: string;
  location_id: string;
  template_id: string;
  crew_id: string | null;
  start_date: string;
  recurrence: string;
  weekday: number | null;
  is_active: boolean;
  locations?: { name: string } | null;
  templates?: { name: string } | null;
}

interface TemplateItem {
  id: string;
  label: string;
  item_type: string;
  sort_order: number;
  template_section_id: string;
}

interface CrewMember {
  id: string;
  user_id: string;
  profiles?: { full_name: string | null } | null;
}

export default function QCAssignPage() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [crews, setCrews] = useState<Array<{ id: string; name: string }>>([]);
  const [scheduleId, setScheduleId] = useState('');
  const [crewId, setCrewId] = useState('');
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [templateItems, setTemplateItems] = useState<TemplateItem[]>([]);
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [breakdown, setBreakdown] = useState<Array<{ userId: string; name: string; tasks: TemplateItem[] }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: membership } = await supabase.from('org_members').select('org_id').eq('user_id', user.id).single();
      if (!membership?.org_id) return;
      setOrgId(membership.org_id);

      const { data: scheds } = await supabase
        .from('schedules')
        .select('id, location_id, template_id, crew_id, start_date, recurrence, weekday, is_active, locations(name), templates(name)')
        .eq('org_id', membership.org_id)
        .eq('is_active', true)
        .order('start_date', { ascending: false });
      setSchedules((scheds as Schedule[]) || []);

      const { data: crewList } = await supabase
        .from('crews')
        .select('id, name')
        .eq('org_id', membership.org_id)
        .order('name');
      setCrews(crewList || []);
    }
    load();
  }, []);

  const loadTemplateItemsAndCrew = async () => {
    if (!scheduleId || !crewId || !orgId) return;
    setIsLoading(true);
    setError(null);
    const supabase = createClient();
    const schedule = schedules.find((s) => s.id === scheduleId);
    if (!schedule?.template_id) {
      setError('Schedule or template not found.');
      setIsLoading(false);
      return;
    }

    const { data: sections } = await supabase
      .from('template_sections')
      .select('id')
      .eq('template_id', schedule.template_id)
      .order('sort_order');
    if (!sections?.length) {
      setTemplateItems([]);
      setCrewMembers([]);
      setBreakdown([]);
      setIsLoading(false);
      return;
    }

    const { data: items } = await supabase
      .from('template_items')
      .select('id, label, item_type, sort_order, template_section_id')
      .in('template_section_id', sections.map((s) => s.id))
      .order('template_section_id')
      .order('sort_order');
    setTemplateItems((items as TemplateItem[]) || []);

    const { data: members } = await supabase
      .from('crew_members')
      .select('id, user_id, profiles(full_name)')
      .eq('crew_id', crewId);
    const mems = (members as CrewMember[]) || [];
    setCrewMembers(mems);

    if (mems.length === 0) {
      setBreakdown([]);
      setIsLoading(false);
      return;
    }

    const itemsList = (items as TemplateItem[]) || [];
    const buckets: TemplateItem[][] = mems.map(() => []);
    itemsList.forEach((item, i) => {
      buckets[i % mems.length].push(item);
    });
    setBreakdown(
      mems.map((m, i) => ({
        userId: m.user_id,
        name: (m.profiles as { full_name?: string } | null)?.full_name || `Employee ${i + 1}`,
        tasks: buckets[i],
      }))
    );
    setIsLoading(false);
  };

  const handleAssign = async () => {
    if (!scheduleId || !orgId || breakdown.length === 0) return;
    setAssigning(true);
    setError(null);
    const supabase = createClient();
    const due = dueDate || new Date().toISOString().split('T')[0];
    try {
      for (const bucket of breakdown) {
        for (const task of bucket.tasks) {
          await supabase.from('task_assignments').insert({
            org_id: orgId,
            schedule_id: scheduleId,
            template_item_id: task.id,
            assigned_user_id: bucket.userId,
            due_date: due,
          });
        }
      }
      router.push('/app/tasks');
      router.refresh();
    } catch (e: any) {
      setError(e.message || 'Failed to create task assignments');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <ListChecks className="h-8 w-8 text-primary" />
          QC Task Assign
        </h1>
        <p className="text-gray-600 mt-1">
          Take a service schedule and number of employees, then break it into task lists per employee.
        </p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-3 text-red-700">{error}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Select schedule & crew</CardTitle>
          <CardDescription>
            Choose the finished service schedule and the crew (employees) to assign tasks to.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Schedule</Label>
              <Select value={scheduleId} onValueChange={setScheduleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select schedule" />
                </SelectTrigger>
                <SelectContent>
                  {schedules.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.locations?.name ?? 'Location'} • {s.templates?.name ?? 'Template'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Crew (employees)</Label>
              <Select value={crewId} onValueChange={setCrewId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select crew" />
                </SelectTrigger>
                <SelectContent>
                  {crews.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Due date for assigned tasks</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <Button
            onClick={loadTemplateItemsAndCrew}
            disabled={isLoading || !scheduleId || !crewId}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ListChecks className="h-4 w-4 mr-2" />}
            Break down into task lists
          </Button>
        </CardContent>
      </Card>

      {breakdown.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Task lists per employee</CardTitle>
            <Button onClick={handleAssign} disabled={assigning}>
              {assigning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Assign tasks to crew
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {breakdown.map((b, i) => (
                <div key={b.userId} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 font-medium mb-2">
                    <Users className="h-4 w-4 text-primary" />
                    {b.name}
                  </div>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    {b.tasks.map((t) => (
                      <li key={t.id}>{t.label}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {schedules.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No active schedules. Create a schedule first under Schedules.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
