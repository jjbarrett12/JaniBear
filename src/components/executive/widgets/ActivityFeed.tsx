'use client';

import Link from 'next/link';
import {
  FileSearch,
  ClipboardCheck,
  FileText,
  FileSignature,
  AlertCircle,
  CheckSquare,
  type LucideIcon,
} from 'lucide-react';
import { SectionHeader } from './SectionHeader';
import type { ActivityFeedItem } from '../types';

const TYPE_ICONS: Record<ActivityFeedItem['type'], LucideIcon> = {
  walkthrough: FileSearch,
  inspection: ClipboardCheck,
  proposal: FileText,
  contract: FileSignature,
  issue: AlertCircle,
  task: CheckSquare,
};

const TYPE_COLOR: Record<ActivityFeedItem['type'], string> = {
  walkthrough: 'text-blue-400',
  inspection: 'text-violet-400',
  proposal: 'text-amber-400',
  contract: 'text-emerald-400',
  issue: 'text-rose-400',
  task: 'text-zinc-400',
};

function FeedItem({
  item,
  isNewest,
}: {
  item: ActivityFeedItem;
  isNewest: boolean;
}) {
  const Icon = TYPE_ICONS[item.type];
  const colorClass = TYPE_COLOR[item.type];
  const Wrapper = item.href ? Link : 'div';
  const wrapperProps = item.href ? { href: item.href } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={`flex gap-3 py-3 border-b border-white/5 last:border-0 ${
        item.href ? 'hover:bg-white/5 transition-colors rounded-lg -mx-2 px-2' : ''
      }`}
    >
      <div className="relative shrink-0">
        <Icon className={`h-4 w-4 mt-0.5 ${colorClass}`} aria-hidden />
        {isNewest ? (
          <span
            className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 animate-pulse"
            aria-hidden
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white">{item.title}</p>
        {item.subtitle ? (
          <p className="text-xs text-white/60 truncate">{item.subtitle}</p>
        ) : null}
        <p className="text-xs text-white/50 mt-0.5">{item.timestamp}</p>
      </div>
    </Wrapper>
  );
}

interface ActivityFeedProps {
  items: ActivityFeedItem[];
  rightAction?: React.ReactNode;
}

export function ActivityFeed({ items, rightAction }: ActivityFeedProps) {
  return (
    <div className="rounded-2xl bg-[#0B1220]/70 backdrop-blur border border-white/10 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)] p-6 h-full flex flex-col">
      <SectionHeader title="Activity" rightAction={rightAction} />
      <div className="flex-1 overflow-auto min-h-0">
        {items.length === 0 ? (
          <p className="text-sm text-white/50 py-4">No recent activity</p>
        ) : (
          items.map((item, i) => (
            <FeedItem
              key={item.id}
              item={item}
              isNewest={i === 0}
            />
          ))
        )}
      </div>
    </div>
  );
}
