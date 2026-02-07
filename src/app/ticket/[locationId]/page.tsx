'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Loader2 } from 'lucide-react';

type LocationDisplay = { name: string; org_name: string } | null;

export default function PublicTicketPage() {
  const params = useParams();
  const locationId = params.locationId as string;
  const [location, setLocation] = useState<LocationDisplay>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!locationId) {
      setLoading(false);
      setError('Invalid link');
      return;
    }
    fetch(`/api/public/locations/${locationId}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? 'Location not found' : 'Failed to load');
        return res.json();
      })
      .then((data) => {
        setLocation({ name: data.name, org_name: data.org_name });
      })
      .catch(() => {
        setError('Location not found');
      })
      .finally(() => setLoading(false));
  }, [locationId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const title = (formData.get('title') as string)?.trim();
    const description = (formData.get('description') as string)?.trim() || undefined;
    const contact_name = (formData.get('contact_name') as string)?.trim() || undefined;
    const contact_phone = (formData.get('contact_phone') as string)?.trim() || undefined;

    if (!title) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/public/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location_id: locationId,
          title,
          description,
          contact_name,
          contact_phone,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-gray-600">Loading…</p>
        </div>
      </div>
    );
  }

  if (error && !location) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive font-medium">{error}</p>
            <p className="text-sm text-gray-500 mt-2">This link may be invalid or expired.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Request received</h2>
            <p className="text-gray-600 mt-2">
              Your service request has been submitted. {location?.org_name} will follow up with you soon.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle className="text-xl">Request service</CardTitle>
          <p className="text-sm text-gray-600">
            {location?.org_name && <span>{location.org_name} – </span>}
            <span className="font-medium">{location?.name}</span>
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">What do you need? *</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g. Restroom needs attention, spill in lobby"
                required
                className="mt-1"
                disabled={submitting}
              />
            </div>
            <div>
              <Label htmlFor="description">Details (optional)</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Any additional details..."
                rows={3}
                className="mt-1"
                disabled={submitting}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact_name">Your name (optional)</Label>
                <Input id="contact_name" name="contact_name" className="mt-1" disabled={submitting} />
              </div>
              <div>
                <Label htmlFor="contact_phone">Phone (optional)</Label>
                <Input id="contact_phone" name="contact_phone" type="tel" className="mt-1" disabled={submitting} />
              </div>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                'Submit request'
              )}
            </Button>
            <p className="text-center text-xs text-gray-500 pt-2">Powered by HelpHubQR</p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
