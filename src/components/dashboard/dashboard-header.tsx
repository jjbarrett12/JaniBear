'use client';

import { useLanguage } from '@/contexts/language-context';
import { getAppT } from '@/lib/app-translations';
import { Calendar } from 'lucide-react';

function getTimeBasedGreeting(locale: string): string {
  const hour = new Date().getHours();
  if (locale === 'es') {
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardHeader({ userName }: { userName: string }) {
  const { locale } = useLanguage();
  const t = getAppT(locale);
  const greeting = getTimeBasedGreeting(locale);
  const dateStr = new Date().toLocaleDateString(locale === 'es' ? 'es' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-primary mb-0.5">
          {greeting}
        </p>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground tracking-tight">
          {userName}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t('dashboardHeresWhatsHappening')}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-card border border-border text-muted-foreground shadow-sm"
          aria-label={`Today is ${dateStr}`}
        >
          <Calendar className="h-4 w-4 text-primary shrink-0" />
          <span className="hidden sm:inline">{dateStr}</span>
          <span className="sm:hidden">
            {new Date().toLocaleDateString(locale === 'es' ? 'es' : 'en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </span>
      </div>
    </div>
  );
}
