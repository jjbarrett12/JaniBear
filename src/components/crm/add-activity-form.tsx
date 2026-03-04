'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createActivity } from '@/actions/crm';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ACTIVITY_TYPES = ['call', 'email', 'sms', 'meeting', 'task', 'note'] as const;

export function AddActivityForm({ clientId, orgId }: { clientId: string; orgId: string }) {
  const [type, setType] = useState<(typeof ACTIVITY_TYPES)[number]>('task');
  const [subject, setSubject] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await createActivity({
      org_id: orgId,
      client_id: clientId,
      type,
      subject: subject.trim() || null,
      due_at: dueAt.trim() || null,
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSubject('');
    setDueAt('');
    window.location.reload();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add activity</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as (typeof ACTIVITY_TYPES)[number])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_at">Due date (optional)</Label>
              <Input
                id="due_at"
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject (optional)</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief description"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading}>{loading ? 'Adding…' : 'Add activity'}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
