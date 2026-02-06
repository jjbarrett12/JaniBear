'use client';

import { useLanguage } from '@/contexts/language-context';

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-lg p-0.5">
      <button
        type="button"
        onClick={() => setLocale('en')}
        className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
          locale === 'en'
            ? 'bg-primary text-primary-foreground'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        aria-label="English"
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLocale('es')}
        className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
          locale === 'es'
            ? 'bg-primary text-primary-foreground'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        aria-label="Español"
      >
        ES
      </button>
    </div>
  );
}
