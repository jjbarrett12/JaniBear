'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type MemberStatus = 'active' | 'invited' | 'suspended' | 'deactivated';

const STATUS_CONFIG: Record<
  MemberStatus,
  { label: string; className: string }
> = {
  active: {
    label: 'Active',
    className: 'bg-emerald-500/15 text-emerald-400 border-emerald-400/30',
  },
  invited: {
    label: 'Invited',
    className: 'bg-amber-500/15 text-amber-400 border-amber-400/30',
  },
  suspended: {
    label: 'Deactivated',
    className: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  },
  deactivated: {
    label: 'Deactivated',
    className: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  },
};

interface AdminStatusChipProps {
  status: MemberStatus | string;
  className?: string;
}

export function AdminStatusChip({ status, className }: AdminStatusChipProps) {
  const normalized = (status?.toLowerCase() ?? 'active') as MemberStatus;
  const config = STATUS_CONFIG[normalized] ?? STATUS_CONFIG.active;
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium text-xs border',
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
