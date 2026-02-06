'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Locale } from '@/lib/survey-translations';

const STORAGE_KEY = 'janibear-locale';

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
  if (stored === 'en' || stored === 'es') return stored;
  const browser = navigator.language?.toLowerCase();
  if (browser?.startsWith('es')) return 'es';
  return 'en';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLocaleState(getInitialLocale());
    setMounted(true);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, next);
      document.documentElement.lang = next;
    }
  }, []);

  useEffect(() => {
    if (!mounted || typeof document === 'undefined') return;
    document.documentElement.lang = locale;
  }, [mounted, locale]);

  const value: LanguageContextValue = { locale, setLocale };
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      locale: 'en' as Locale,
      setLocale: (_: Locale) => {},
    };
  }
  return ctx;
}
