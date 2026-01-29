'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ScheduleFormProps {
  initialData?: {
    id: string;
    location_id: string;
    template_id: string;
    crew_id?: string;
    assigned_user_id?: string;
    start_date: string;
    recurrence: 'none' | 'weekly';
    weekday?: number;
    is_active: boolean;
  };
}

export function ScheduleForm({ initialData }: ScheduleFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [locationId, setLocationId] = useState(initialData?.location_id || '');
  const [templateId, setTemplateId] = useState(initialData?.template_id || '');
  const [crewId, setCrewId] = useState(initialData?.crew_id || '');
  const [assignedUserId, setAssignedUserId] = useState(initialData?.assigned_user_id || '');
  const [startDate, setStartDate] = useState(
    initialData?.start_date ? new Date(initialData.start_date).toISOString().split('T')[0] : ''
  );
  const [recurrence, setRecurrence] = useState<'none' | 'weekly'>(initialData?.recurrence || 'none');
  const [weekday, setWeekday] = useState(initialData?.weekday?.toString() || '1');
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);

  const [locations, setLocations] = useState<Array<{ id: string; name: string }>>([]);
  const [templates, setTemplates] = useState<Array<{ id: string; name: string }>>([]);
  const [crews, setCrews] = useState<Array<{ id: string; name: string }>>([]);
  const [users, setUsers] = useState<Array<{ id: string; full_name: string | null }>>([]);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data: membership } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (!membership) return;

      // Load locations
      const { data: locs } = await supabase
        .from('locations')
        .select('id, name')
        .eq('org_id', membership.org_id)
        .order('name');
      if (locs) setLocations(locs);

      // Load templates
      const { data: tmpls } = await supabase
        .from('templates')
        .select('id, name')
        .eq('org_id', membership.org_id)
        .eq('is_active', true)
        .order('name');
      if (tmpls) setTemplates(tmpls);

      // Load crews
      const { data: crs } = await supabase
        .from('crews')
        .select('id, name')
        .eq('org_id', membership.org_id)
        .order('name');
      if (crs) setCrews(crs);

      // Load users (org members)
      const { data: mems } = await supabase
        .from('org_members')
        .select('user_id, profiles(full_name)')
        .eq('org_id', membership.org_id);
      if (mems) {
        setUsers(mems.map((m: any) => ({
          id: m.user_id,
          full_name: m.profiles?.full_name || null,
        })));
      }
    }

    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setError('You must be logged in');
      setIsLoading(false);
      return;
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (!membership) {
      setError('You must belong to an organization');
      setIsLoading(false);
      return;
    }

    try {
      const scheduleData = {
        org_id: membership.org_id,
        location_id: locationId,
        template_id: templateId,
        crew_id: crewId || null,
        assigned_user_id: assignedUserId || null,
        start_date: startDate,
        recurrence,
        weekday: recurrence === 'weekly' ? parseInt(weekday) : null,
        is_active: isActive,
      };

      if (initialData) {
        const { error: updateError } = await supabase
          .from('schedules')
          .update(scheduleData)
          .eq('id', initialData.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('schedules')
          .insert(scheduleData);

        if (insertError) throw insertError;
      }

      router.push('/app/schedules');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to save schedule');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? 'Edit Schedule' : 'Create Schedule'}</CardTitle>
        <CardDescription>
          {initialData ? 'Update schedule details' : 'Set up a new inspection schedule'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Select value={locationId} onValueChange={setLocationId} required disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="template">Template *</Label>
            <Select value={templateId} onValueChange={setTemplateId} required disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((tmpl) => (
                  <SelectItem key={tmpl.id} value={tmpl.id}>
                    {tmpl.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="crew">Crew (Optional)</Label>
            <Select value={crewId} onValueChange={setCrewId} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select crew" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {crews.map((crew) => (
                  <SelectItem key={crew.id} value={crew.id}>
                    {crew.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned_user">Assigned Inspector (Optional)</Label>
            <Select value={assignedUserId} onValueChange={setAssignedUserId} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select inspector" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.full_name || u.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="start_date">Start Date *</Label>
            <Input
              id="start_date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recurrence">Recurrence *</Label>
            <Select value={recurrence} onValueChange={(v) => setRecurrence(v as 'none' | 'weekly')} required disabled={isLoading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">One-time</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {recurrence === 'weekly' && (
            <div className="space-y-2">
              <Label htmlFor="weekday">Day of Week *</Label>
              <Select value={weekday} onValueChange={setWeekday} required disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sunday</SelectItem>
                  <SelectItem value="1">Monday</SelectItem>
                  <SelectItem value="2">Tuesday</SelectItem>
                  <SelectItem value="3">Wednesday</SelectItem>
                  <SelectItem value="4">Thursday</SelectItem>
                  <SelectItem value="5">Friday</SelectItem>
                  <SelectItem value="6">Saturday</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={isLoading}
              className="rounded"
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : initialData ? 'Update' : 'Create'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
