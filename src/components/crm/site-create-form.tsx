'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DAYS_PRESETS = [
  '1x week - Mon', '1x week - Tue', '1x week - Wed', '1x week - Thu', '1x week - Fri',
  '1x week - Sat', '1x week - Sun', '2x week - Mon/Wed', '2x week - Mon/Fri', '3x week - M/W/F',
  '4x week', '5x week', 'Daily',
];

export function SiteCreateForm({
  orgId,
  clients,
}: {
  orgId: string;
  clients: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    client_id: '',
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    square_footage: '',
    restroom_count: '',
    days_of_service: '',
    door_alarm_code: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: insertError } = await supabase
        .from('locations')
        .insert({
          org_id: orgId,
          client_id: form.client_id || null,
          name: form.name.trim() || 'Unnamed Site',
          address: form.address.trim() || null,
          city: form.city.trim() || null,
          state: form.state.trim() || null,
          zip: form.zip.trim() || null,
          square_footage: form.square_footage ? parseFloat(form.square_footage) : null,
          restroom_count: form.restroom_count ? parseInt(form.restroom_count, 10) : null,
          days_of_service: form.days_of_service || null,
          door_alarm_code: form.door_alarm_code.trim() || null,
          notes: form.notes.trim() || null,
          status: 'active',
        })
        .select('id')
        .single();
      if (insertError) throw insertError;
      router.push(`/app/sites/${data.id}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create site');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>New site</CardTitle>
        <p className="text-sm text-muted-foreground">Data is stored in locations (canonical). No writes to public.sites.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="space-y-2">
            <Label htmlFor="client_id">Client (optional)</Label>
            <Select value={form.client_id} onValueChange={(v) => setForm((f) => ({ ...f, client_id: v }))}>
              <SelectTrigger id="client_id">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Site name *</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Building or site name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Street address" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="zip">ZIP</Label>
            <Input id="zip" value={form.zip} onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="square_footage">Square footage</Label>
              <Input id="square_footage" type="number" min={0} value={form.square_footage} onChange={(e) => setForm((f) => ({ ...f, square_footage: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="restroom_count">Restroom count</Label>
              <Input id="restroom_count" type="number" min={0} value={form.restroom_count} onChange={(e) => setForm((f) => ({ ...f, restroom_count: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="days_of_service">Days of service</Label>
            <Select value={form.days_of_service} onValueChange={(v) => setForm((f) => ({ ...f, days_of_service: v }))}>
              <SelectTrigger id="days_of_service">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {DAYS_PRESETS.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="door_alarm_code">Door / alarm code</Label>
            <Input id="door_alarm_code" value={form.door_alarm_code} onChange={(e) => setForm((f) => ({ ...f, door_alarm_code: e.target.value }))} placeholder="Access code" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={3} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create site'}</Button>
            <Button type="button" variant="outline" onClick={() => router.push('/app/sites')}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
