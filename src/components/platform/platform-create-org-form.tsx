'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { createOrg } from '@/actions/platform';

export function PlatformCreateOrgForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [plan, setPlan] = useState('cub');
  const [trialDays, setTrialDays] = useState('14');
  const [success, setSuccess] = useState<{ orgId: string; orgName: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.set('name', name);
    const result = await createOrg(formData);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    if (result?.ok && result?.orgId) {
      setSuccess({ orgId: result.orgId, orgName: name });
    }
  }

  if (success) {
    return (
      <div className="space-y-6 py-4">
        <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
          <CheckCircle className="h-8 w-8 shrink-0" />
          <div>
            <p className="font-semibold">Org created</p>
            <p className="text-sm text-muted-foreground">{success.orgName}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={`/platform/orgs/${success.orgId}`}>View org</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/platform/orgs">Back to list</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="space-y-2">
        <Label htmlFor="name">Org name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Acme Cleaning Co"
          required
          className="max-w-md"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ownerEmail">Owner email</Label>
        <div className="relative max-w-md">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="ownerEmail"
            type="email"
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.target.value)}
            placeholder="owner@example.com"
            className="pl-9"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="plan">Plan</Label>
        <select
          id="plan"
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm max-w-[200px]"
        >
          <option value="cub">Cub</option>
          <option value="grizzly">Grizzly</option>
          <option value="kodiak">Kodiak</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="trialDays">Trial length (days)</Label>
        <Input
          id="trialDays"
          type="number"
          min={0}
          value={trialDays}
          onChange={(e) => setTrialDays(e.target.value)}
          className="max-w-[120px]"
        />
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating…' : 'Create org'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
