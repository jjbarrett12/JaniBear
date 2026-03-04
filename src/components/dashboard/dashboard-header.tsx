'use client';

import { useLanguage } from '@/contexts/language-context';
import { getAppT } from '@/lib/app-translations';
import type { Locale } from '@/lib/survey-translations';
import { getIntlLocale } from '@/lib/survey-translations';
import { Calendar } from 'lucide-react';

const GREETINGS: Record<Locale, [string, string, string]> = {
  en: ['Good morning', 'Good afternoon', 'Good evening'],
  es: ['Buenos días', 'Buenas tardes', 'Buenas noches'],
  pt: ['Bom dia', 'Boa tarde', 'Boa noite'],
  it: ['Buongiorno', 'Buon pomeriggio', 'Buonasera'],
  ru: ['Доброе утро', 'Добрый день', 'Добрый вечер'],
  uk: ['Доброго ранку', 'Добрий день', 'Добрий вечір'],
  zh: ['早上好', '下午好', '晚上好'],
  vi: ['Chào buổi sáng', 'Chào buổi chiều', 'Chào buổi tối'],
  tl: ['Magandang umaga', 'Magandang hapon', 'Magandang gabi'],
  fr: ['Bonjour', 'Bon après-midi', 'Bonsoir'],
  ar: ['صباح الخير', 'مساء الخير', 'مساء الخير'],
  ko: ['좋은 아침', '좋은 오후', '안녕하세요'],
};

function getTimeBasedGreeting(locale: Locale): string {
  const hour = new Date().getHours();
  const [morning, afternoon, evening] = GREETINGS[locale] ?? GREETINGS.en;
  if (hour < 12) return morning;
  if (hour < 18) return afternoon;
  return evening;
}

export function DashboardHeader({
  userName,
  subtitle,
}: {
  userName: string;
  /** Optional override for the subtitle (e.g. franchisee vs owner-operator) */
  subtitle?: string;
}) {
  const { locale } = useLanguage();
  const t = getAppT(locale);
  const greeting = getTimeBasedGreeting(locale);
  const intlLocale = getIntlLocale(locale);
  const dateStr = new Date().toLocaleDateString(intlLocale, {
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
          {subtitle ?? t('dashboardHeresWhatsHappening')}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-card border border-border text-muted-foreground"
          aria-label={`Today is ${dateStr}`}
        >
          <Calendar className="h-4 w-4 text-primary shrink-0" />
          <span className="hidden sm:inline">{dateStr}</span>
          <span className="sm:hidden">
            {new Date().toLocaleDateString(intlLocale, {
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
