'use client';

import { useLanguage } from '@/contexts/language-context';
import { getAppT } from '@/lib/app-translations';

export function DashboardHeader({ userName }: { userName: string }) {
  const { locale } = useLanguage();
  const t = getAppT(locale);

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          {t('dashboardWelcomeBack')}, {userName}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {t('dashboardHeresWhatsHappening')}
        </p>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <span className="hidden md:inline">
          {new Date().toLocaleDateString(locale === 'es' ? 'es' : 'en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </span>
      </div>
    </div>
  );
}
