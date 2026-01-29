'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function InspectionStarter() {
  const router = useRouter();
  const [locationId, setLocationId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [locations, setLocations] = useState<Array<{ id: string; name: string }>>([]);
  const [templates, setTemplates] = useState<Array<{ id: string; name: string }>>([]);

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

      const { data: locs } = await supabase
        .from('locations')
        .select('id, name')
        .eq('org_id', membership.org_id)
        .order('name');
      if (locs) setLocations(locs);

      const { data: tmpls } = await supabase
        .from('templates')
        .select('id, name')
        .eq('org_id', membership.org_id)
        .eq('is_active', true)
        .order('name');
      if (tmpls) setTemplates(tmpls);
    }

    loadData();
  }, []);

  const handleStart = () => {
    if (locationId && templateId) {
      router.push(`/app/inspections/run?location=${locationId}&template=${templateId}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Inspection Details</CardTitle>
        <CardDescription>Choose the location and template for this inspection</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="location">Location *</Label>
          <Select value={locationId} onValueChange={setLocationId}>
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
          <Select value={templateId} onValueChange={setTemplateId}>
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

        <Button onClick={handleStart} className="w-full" disabled={!locationId || !templateId}>
          Start Inspection
        </Button>
      </CardContent>
    </Card>
  );
}
