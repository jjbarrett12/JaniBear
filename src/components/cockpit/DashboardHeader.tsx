'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export interface DashboardHeaderProps {
  userName: string;
  orgName?: string | null;
  subtitle?: string;
  quickActions?: React.ReactNode;
  className?: string;
}

export function DashboardHeader({
  userName,
  orgName,
  subtitle = "Here's what's happening with your operations today.",
  quickActions,
  className,
}: DashboardHeaderProps) {
  const [time, setTime] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [greeting, setGreeting] = useState(getGreeting());

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
      setGreeting(getGreeting());
    };
    format();
    const id = setInterval(format, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        'pb-4 border-b border-border',
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl truncate">
          {greeting}, {userName}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">{subtitle}</p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
        {orgName && (
          <span className="text-sm font-medium text-foreground truncate max-w-[180px]" title={orgName}>
            {orgName}
          </span>
        )}
        <span className="text-xs sm:text-sm text-muted-foreground tabular-nums flex items-center gap-2">
          <span className="font-medium text-foreground">{time}</span>
          <span aria-hidden className="text-muted-foreground/70">·</span>
          <span>{dateStr}</span>
        </span>
        {quickActions}
      </div>
    </header>
  );
}
