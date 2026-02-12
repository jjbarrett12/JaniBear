'use client';

import { useLanguage } from '@/contexts/language-context';
import type { Locale } from '@/lib/survey-translations';
import { LOCALE_LABELS } from '@/lib/survey-translations';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const LOCALES: Locale[] = ['en', 'es', 'pt', 'it', 'ru', 'uk', 'zh', 'vi', 'tl', 'fr', 'ar', 'ko'];

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <Select value={locale} onValueChange={(value) => setLocale(value as Locale)}>
      <SelectTrigger className="w-[10rem] h-9 text-xs" aria-label="Select language">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LOCALES.map((loc) => (
          <SelectItem key={loc} value={loc} className="text-xs">
            {LOCALE_LABELS[loc]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
