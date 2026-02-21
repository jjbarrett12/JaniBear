'use client';

import { useRouter } from 'next/navigation';
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

export function ClientsSearchFilter({
  initialQ = '',
  initialStatus,
}: {
  initialQ?: string;
  initialStatus?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(initialStatus ?? 'all');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const q = (form.elements.namedItem('q') as HTMLInputElement)?.value?.trim() ?? '';
    const next = new URLSearchParams();
    if (q) next.set('q', q);
    if (status && status !== 'all') next.set('status', status);
    startTransition(() => {
      router.push(`/app/crm?${next.toString()}`);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
      <div className="space-y-1">
        <Label htmlFor="crm-search">Search</Label>
        <Input
          id="crm-search"
          name="q"
          placeholder="Client name..."
          defaultValue={initialQ}
          className="max-w-xs"
        />
      </div>
      <div className="space-y-1">
        <Label>Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="former">Former</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" variant="secondary" disabled={isPending}>
        {isPending ? 'Updating…' : 'Filter'}
      </Button>
    </form>
  );
}
