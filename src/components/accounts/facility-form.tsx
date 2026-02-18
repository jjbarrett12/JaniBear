'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import type { Database } from '@/lib/types/database';

type Facility = Database['public']['Tables']['facilities']['Row'];

export function FacilityForm({
  accountId,
  initialData,
}: {
  accountId: string;
  initialData?: Facility | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(initialData?.name ?? '');
  const [address_line1, setAddressLine1] = useState(initialData?.address_line1 ?? '');
  const [address_line2, setAddressLine2] = useState(initialData?.address_line2 ?? '');
  const [city, setCity] = useState(initialData?.city ?? '');
  const [state, setState] = useState(initialData?.state ?? '');
  const [zip, setZip] = useState(initialData?.zip ?? '');
  const [timezone, setTimezone] = useState(initialData?.timezone ?? '');
  const [access_notes, setAccessNotes] = useState(initialData?.access_notes ?? '');
  const [service_notes, setServiceNotes] = useState(initialData?.service_notes ?? '');
  const [is_primary, setIsPrimary] = useState(initialData?.is_primary ?? false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const payload = {
      account_id: accountId,
      name: name.trim(),
      address_line1: address_line1.trim() || null,
      address_line2: address_line2.trim() || null,
      city: city.trim() || null,
      state: state.trim() || null,
      zip: zip.trim() || null,
      timezone: timezone.trim() || null,
      access_notes: access_notes.trim() || null,
      service_notes: service_notes.trim() || null,
      is_primary,
      updated_at: new Date().toISOString(),
    };

    if (initialData) {
      const { error } = await supabase.from('facilities').update(payload).eq('id', initialData.id);
      setLoading(false);
      if (!error) {
        router.push(`/app/accounts/${accountId}/facilities/${initialData.id}`);
        router.refresh();
      }
    } else {
      const { data: org } = await supabase.from('accounts').select('org_id').eq('id', accountId).single();
      if (!org) {
        setLoading(false);
        return;
      }
      const { error } = await supabase.from('facilities').insert({
        org_id: org.org_id,
        ...payload,
      });
      setLoading(false);
      if (!error) {
        router.push(`/app/accounts/${accountId}`);
        router.refresh();
      }
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Facility name *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address_line1">Address line 1</Label>
            <Input id="address_line1" value={address_line1} onChange={(e) => setAddressLine1(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address_line2">Address line 2</Label>
            <Input id="address_line2" value={address_line2} onChange={(e) => setAddressLine2(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" value={state} onChange={(e) => setState(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">ZIP</Label>
              <Input id="zip" value={zip} onChange={(e) => setZip(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input id="timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="e.g. America/New_York" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="access_notes">Access notes</Label>
            <Textarea id="access_notes" value={access_notes} onChange={(e) => setAccessNotes(e.target.value)} rows={2} placeholder="Keys, codes, parking, security" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="service_notes">Service notes</Label>
            <Textarea id="service_notes" value={service_notes} onChange={(e) => setServiceNotes(e.target.value)} rows={2} placeholder="Scope notes for cleaners" />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="is_primary" checked={is_primary} onCheckedChange={(c) => setIsPrimary(!!c)} />
            <Label htmlFor="is_primary">Primary facility for this account</Label>
          </div>
          <Button type="submit" disabled={loading}>{loading ? 'Saving…' : initialData ? 'Save changes' : 'Create facility'}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
