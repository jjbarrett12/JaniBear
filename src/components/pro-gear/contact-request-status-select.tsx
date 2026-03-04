'use client';

import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateContactRequestStatusAction } from '@/app/app/pro-gear/admin-actions';

const STATUSES = ['new', 'contacted', 'closed'] as const;

export function ContactRequestStatusSelect({
  requestId,
  currentStatus,
}: {
  requestId: string;
  currentStatus: string;
}) {
  const router = useRouter();

  async function handleChange(value: string) {
    if (!STATUSES.includes(value as (typeof STATUSES)[number])) return;
    await updateContactRequestStatusAction(requestId, value as (typeof STATUSES)[number]);
    router.refresh();
  }

  return (
    <Select value={currentStatus} onValueChange={handleChange}>
      <SelectTrigger className="w-[120px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
