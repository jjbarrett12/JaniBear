'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface OpsHeaderProps {
  title?: string;
  subtitle?: string;
  orgName?: string | null;
  quickActions?: React.ReactNode;
  className?: string;
}

export function OpsHeader({
  title = 'Ops Command Center',
  subtitle = 'Live deployment activity, account health, labor coverage, and urgent action items.',
  orgName,
  quickActions,
  className,
}: OpsHeaderProps) {
  const [time, setTime] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const format = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
      setDateStr(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      );
    };
    format();
    const id = setInterval(format, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-border',
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-0.5 max-w-xl">{subtitle}</p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 shrink-0">
        {orgName && (
          <span className="text-sm font-medium text-foreground truncate max-w-[180px]" title={orgName}>
            {orgName}
          </span>
        )}
        <span className="text-sm text-muted-foreground tabular-nums flex items-center gap-2">
          <span className="font-medium text-foreground">{time}</span>
          <span aria-hidden>·</span>
          <span>{dateStr}</span>
        </span>
        {quickActions}
      </div>
    </header>
  );
}
