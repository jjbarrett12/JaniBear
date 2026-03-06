'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { setLeadStatusAction } from '@/actions/leads';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'walkthrough_scheduled', label: 'Walk-through Scheduled' },
  { value: 'walkthrough_done', label: 'Walk-through Done' },
  { value: 'proposal_sent', label: 'Proposal Sent' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

interface Appointment {
  id: string;
  scheduled_at: string;
  location_address: string | null;
  notes: string | null;
  status: string;
}

interface LeadDetailClientProps {
  leadId: string;
  leadStatus: string;
  appointments: Appointment[];
}

export function LeadDetailClient({
  leadId,
  leadStatus,
  appointments,
}: LeadDetailClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState(leadStatus);
  const [savingStatus, setSavingStatus] = useState(false);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('');
  const [apptLocation, setApptLocation] = useState('');
  const [apptNotes, setApptNotes] = useState('');
  const [savingAppt, setSavingAppt] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setSavingStatus(true);
    const res = await setLeadStatusAction(leadId, newStatus);
    if (res.ok) setStatus(newStatus);
    setSavingStatus(false);
    router.refresh();
  };

  const handleScheduleAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apptDate || !apptTime) return;
    setSavingAppt(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: membership } = await supabase.from('org_members').select('org_id').eq('user_id', user.id).single();
    if (!membership?.org_id) return;
    const scheduledAt = new Date(`${apptDate}T${apptTime}`).toISOString();
    await supabase.from('walkthrough_appointments').insert({
      org_id: membership.org_id,
      lead_id: leadId,
      scheduled_at: scheduledAt,
      location_address: apptLocation || null,
      notes: apptNotes || null,
      status: 'scheduled',
    });
    await setLeadStatusAction(leadId, 'walkthrough_scheduled');
    setStatus('walkthrough_scheduled');
    setApptDate('');
    setApptTime('');
    setApptLocation('');
    setApptNotes('');
    setShowAppointmentForm(false);
    setSavingAppt(false);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={status} onValueChange={handleStatusChange} disabled={savingStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {savingStatus && <Loader2 className="h-4 w-4 animate-spin mt-2" />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Walk-through
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowAppointmentForm(!showAppointmentForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Schedule
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {showAppointmentForm && (
            <form onSubmit={handleScheduleAppointment} className="space-y-3 p-4 border rounded-lg bg-gray-50">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={apptDate} onChange={(e) => setApptDate(e.target.value)} required />
                </div>
                <div>
                  <Label>Time</Label>
                  <Input type="time" value={apptTime} onChange={(e) => setApptTime(e.target.value)} required />
                </div>
              </div>
              <div>
                <Label>Location / address (optional)</Label>
                <Input value={apptLocation} onChange={(e) => setApptLocation(e.target.value)} placeholder="Address for walk-through" />
              </div>
              <div>
                <Label>Notes (optional)</Label>
                <Input value={apptNotes} onChange={(e) => setApptNotes(e.target.value)} placeholder="Notes" />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={savingAppt}>
                  {savingAppt ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save appointment
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowAppointmentForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
          {appointments.length > 0 ? (
            <ul className="space-y-2">
              {appointments.map((appt) => (
                <li key={appt.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{formatDate(appt.scheduled_at)}</p>
                    {appt.location_address && <p className="text-sm text-gray-500">{appt.location_address}</p>}
                    {appt.notes && <p className="text-xs text-gray-400">{appt.notes}</p>}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    appt.status === 'completed' ? 'bg-green-100 text-green-800' :
                    appt.status === 'cancelled' ? 'bg-gray-100 text-gray-600' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {appt.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No walk-through scheduled yet.</p>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
