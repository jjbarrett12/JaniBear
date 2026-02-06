'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface NewTicketFormProps {
  orgId: string;
  locations: Array<{ id: string; name: string }>;
}

export function NewTicketForm({ orgId, locations }: NewTicketFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationId, setLocationId] = useState<string>('');
  const [priority, setPriority] = useState<string>('medium');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const title = (form.querySelector<HTMLInputElement>('[name="title"]')?.value ?? '').trim();
    const description = (form.querySelector<HTMLInputElement>('[name="description"]')?.value ?? '').trim() || null;

    if (!locationId || !title) {
      setError('Please select a location and enter a title.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from('service_tickets')
      .insert({
        org_id: orgId,
        location_id: locationId,
        title,
        description,
        priority,
        source: 'manual',
        status: 'open',
      })
      .select('id')
      .single();

    setLoading(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    if (data?.id) {
      router.push(`/app/tickets/${data.id}`);
      router.refresh();
    }
  };

  return (
    <Card className="dark:bg-gray-900 dark:border-gray-800">
      <CardHeader>
        <CardTitle>Ticket details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="location_id">Location *</Label>
            <Select
              value={locationId}
              onValueChange={setLocationId}
              disabled={locations.length === 0}
            >
              <SelectTrigger id="location_id" className="mt-1">
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
            {locations.length === 0 && (
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                Add a location first under Locations.
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g. Restroom needs attention"
              required
              className="mt-1"
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Details..."
              rows={3}
              className="mt-1"
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={setPriority} disabled={loading}>
              <SelectTrigger id="priority" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2 pt-2">
            <Link href="/app/tickets">
              <Button type="button" variant="outline" disabled={loading}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={loading || locations.length === 0}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                'Create ticket'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
