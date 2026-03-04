'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SlidersHorizontal } from 'lucide-react';
import type { CrmOwner } from '@/actions/crm';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'prospect', label: 'Prospect' },
  { value: 'churned', label: 'Churned' },
  { value: 'do-not-contact', label: 'Do Not Contact' },
];

const TAG_OPTIONS = [
  { value: '', label: 'All tags' },
  { value: 'Medical', label: 'Medical' },
  { value: 'Education', label: 'Education' },
  { value: 'School', label: 'School' },
  { value: 'Class A Office', label: 'Class A Office' },
  { value: 'Industrial', label: 'Industrial' },
  { value: 'Retail', label: 'Retail' },
  { value: 'Government', label: 'Government' },
  { value: 'Other', label: 'Other' },
];

export function AccountsFilterBar({
  initialQ = '',
  initialStatus,
  initialOwner,
  initialTag,
  initialCity,
  initialZip,
  owners,
}: {
  initialQ?: string;
  initialStatus?: string;
  initialOwner?: string;
  initialTag?: string;
  initialCity?: string;
  initialZip?: string;
  owners: CrmOwner[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showMore, setShowMore] = useState(!!(initialCity ?? initialZip));
  const [q, setQ] = useState(initialQ ?? '');
  const [status, setStatus] = useState(initialStatus ?? 'all');
  const [owner, setOwner] = useState(initialOwner ?? 'all');
  const [tag, setTag] = useState(initialTag ?? '');
  const [city, setCity] = useState(initialCity ?? '');
  const [zip, setZip] = useState(initialZip ?? '');

  const apply = () => {
    const next = new URLSearchParams(searchParams.toString());
    if (q.trim()) next.set('q', q.trim()); else next.delete('q');
    if (status && status !== 'all') next.set('status', status); else next.delete('status');
    if (owner && owner !== 'all') next.set('owner_id', owner); else next.delete('owner_id');
    if (tag) next.set('tag', tag); else next.delete('tag');
    if (city.trim()) next.set('city', city.trim()); else next.delete('city');
    if (zip.trim()) next.set('zip', zip.trim()); else next.delete('zip');
    next.delete('page');
    startTransition(() => router.push(`/app/crm?${next.toString()}`));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search accounts & contacts..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), apply())}
          className="h-9 w-[200px] sm:w-[240px]"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-9 w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={owner} onValueChange={setOwner}>
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue placeholder="Owner" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All owners</SelectItem>
            {owners.map((o) => (
              <SelectItem key={o.id} value={o.id}>{o.full_name || o.id.slice(0, 8)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tag} onValueChange={setTag}>
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue placeholder="Tag" />
          </SelectTrigger>
          <SelectContent>
            {TAG_OPTIONS.map((o) => (
              <SelectItem key={o.value || 'all'} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" size="sm" className="h-9 gap-1" onClick={() => setShowMore(!showMore)}>
          <SlidersHorizontal className="h-4 w-4" />
          More filters
        </Button>
        <Button type="button" size="sm" className="h-9" onClick={apply} disabled={isPending}>
          {isPending ? 'Applying…' : 'Apply'}
        </Button>
      </div>
      {showMore && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
          <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} className="h-8 w-32" />
          <Input placeholder="ZIP" value={zip} onChange={(e) => setZip(e.target.value)} className="h-8 w-24" />
          <Button type="button" variant="ghost" size="sm" className="h-8" onClick={apply}>Apply</Button>
        </div>
      )}
    </div>
  );
}
