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
  const [locationId, setLocationId] = useState<string | undefined>(undefined);
  const [templateId, setTemplateId] = useState<string | undefined>(undefined);
  const [locations, setLocations] = useState<Array<{ id: string; name: string }>>([]);
  const [templates, setTemplates] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: membership } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (!membership) {
        setLoading(false);
        return;
      }

      const [{ data: locs }, { data: tmpls }] = await Promise.all([
        supabase
          .from('locations')
          .select('id, name')
          .eq('org_id', membership.org_id)
          .order('name'),
        supabase
          .from('templates')
          .select('id, name')
          .eq('org_id', membership.org_id)
          .eq('is_active', true)
          .order('name'),
      ]);
      if (locs) setLocations(locs);
      if (tmpls) setTemplates(tmpls);
      setLoading(false);
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
          <Label htmlFor="inspection-location">Location *</Label>
          <Select
            value={locationId ?? ''}
            onValueChange={(v) => setLocationId(v || undefined)}
            disabled={loading}
          >
            <SelectTrigger id="inspection-location">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {locations.length === 0 && !loading ? (
                <div className="py-4 text-center text-sm text-muted-foreground">No locations found. Add sites first.</div>
              ) : (
                locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="inspection-template">Template *</Label>
          <Select
            value={templateId ?? ''}
            onValueChange={(v) => setTemplateId(v || undefined)}
            disabled={loading}
          >
            <SelectTrigger id="inspection-template">
              <SelectValue placeholder="Select template" />
            </SelectTrigger>
            <SelectContent>
              {templates.length === 0 && !loading ? (
                <div className="py-4 text-center text-sm text-muted-foreground">No templates found. Create one under Brand Standards.</div>
              ) : (
                templates.map((tmpl) => (
                  <SelectItem key={tmpl.id} value={tmpl.id}>
                    {tmpl.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleStart} className="w-full" disabled={!locationId || !templateId || loading}>
          Start Inspection
        </Button>
      </CardContent>
    </Card>
  );
}
