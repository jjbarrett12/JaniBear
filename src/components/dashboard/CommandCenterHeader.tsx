'use client';

import { useEffect, useState } from 'react';

type CommandCenterHeaderProps = {
  userName: string;
  subtitle?: string;
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function CommandCenterHeader({
  userName,
  subtitle = "Here's what requires your attention today.",
}: CommandCenterHeaderProps) {
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
    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground tracking-tight">
          {greeting}, {userName}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3 text-sm text-muted-foreground tabular-nums">
        <span className="font-medium text-foreground">{time}</span>
        <span aria-hidden>·</span>
        <span>{dateStr}</span>
      </div>
    </header>
  );
}
