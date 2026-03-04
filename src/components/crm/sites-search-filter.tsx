'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTransition, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';

export function SitesSearchFilter({
  initialQ = '',
  initialStatus,
  initialHasIssues,
  initialCrewId,
  crews,
}: {
  initialQ?: string;
  initialStatus?: string;
  initialHasIssues?: boolean;
  initialCrewId?: string;
  crews: { id: string; name: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(initialStatus ?? 'all');
  const [hasIssues, setHasIssues] = useState(!!initialHasIssues);
  const [crewId, setCrewId] = useState(initialCrewId ?? 'all');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const q = (form.elements.namedItem('q') as HTMLInputElement)?.value?.trim() ?? '';
    const next = new URLSearchParams();
    if (q) next.set('q', q);
    if (status && status !== 'all') next.set('status', status);
    if (hasIssues) next.set('has_issues', '1');
    if (crewId && crewId !== 'all') next.set('crew', crewId);
    startTransition(() => {
      router.push(`/app/sites?${next.toString()}`);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
      <div className="space-y-1">
        <Label htmlFor="sites-search">Search</Label>
        <Input
          id="sites-search"
          name="q"
          placeholder="Site name, address, city..."
          defaultValue={initialQ}
          className="max-w-xs"
        />
      </div>
      <div className="space-y-1">
        <Label>Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="has_issues" checked={hasIssues} onCheckedChange={(c) => setHasIssues(!!c)} />
        <Label htmlFor="has_issues" className="text-sm">Has open issues</Label>
      </div>
      {crews.length > 0 && (
        <div className="space-y-1">
          <Label>Crew</Label>
          <Select value={crewId} onValueChange={setCrewId}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {crews.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <Button type="submit" variant="secondary" disabled={isPending}>
        {isPending ? 'Updating…' : 'Filter'}
      </Button>
    </form>
  );
}
