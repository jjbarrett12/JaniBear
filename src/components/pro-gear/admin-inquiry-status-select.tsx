'use client';

import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updatePrivateLabelInquiryStatusAction } from '@/app/app/pro-gear/admin-actions';

const STATUSES = ['new', 'contacted', 'quoted', 'closed'] as const;

export function InquiryStatusSelect({
  inquiryId,
  currentStatus,
}: {
  inquiryId: string;
  currentStatus: string;
}) {
  const router = useRouter();

  async function handleChange(value: string) {
    if (!STATUSES.includes(value as (typeof STATUSES)[number])) return;
    await updatePrivateLabelInquiryStatusAction(inquiryId, value as (typeof STATUSES)[number]);
    router.refresh();
  }

  return (
    <Select value={currentStatus} onValueChange={handleChange}>
      <SelectTrigger className="w-[130px]">
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
