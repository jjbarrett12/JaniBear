'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { SurveyWizard } from '@/components/survey/survey-wizard';
import { useLanguage } from '@/contexts/language-context';
import { getSurveyT } from '@/lib/survey-translations';
import { LanguageSwitcher } from '@/components/app/language-switcher';
import { useMemo } from 'react';

export default function SurveyPage() {
  const { locale } = useLanguage();
  const t = useMemo(() => getSurveyT(locale), [locale]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <nav className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-1.5 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center shrink-0 bg-transparent [&>span]:bg-transparent [&>span]:shadow-none [&>span]:block" style={{ minHeight: 40 }}>
            <Image src="/yellow.png" alt="JANIBEAR" width={560} height={182} className="!h-16 md:!h-20 w-auto !max-h-none object-contain bg-transparent" unoptimized />
          </Link>
          <div className="flex items-center justify-end gap-2 md:gap-4 flex-1 min-w-0 flex-wrap">
            <div className="[&_.border]:border-zinc-700 [&_.bg-background]:bg-zinc-900 [&_.text-foreground]:text-zinc-100">
              <LanguageSwitcher />
            </div>
            <Link href="/pricing"><Button variant="ghost" size="sm" className="text-zinc-300 hover:text-white hover:bg-zinc-800 shrink-0">{t('pricing')}</Button></Link>
            <Link href="/survey"><Button variant="ghost" size="sm" className="text-zinc-300 hover:text-white hover:bg-zinc-800 shrink-0">{t('findYourPlan')}</Button></Link>
            <Link href="/#features"><Button variant="ghost" size="sm" className="text-zinc-300 hover:text-white hover:bg-zinc-800 shrink-0">{t('features')}</Button></Link>
            <Link href="/contact"><Button variant="ghost" size="sm" className="text-zinc-300 hover:text-white hover:bg-zinc-800 shrink-0">{t('contact')}</Button></Link>
            <Link href="/auth/login"><Button variant="ghost" size="sm" className="text-zinc-300 hover:text-white hover:bg-zinc-800 shrink-0">{t('signIn')}</Button></Link>
            <Link href="/auth/signup"><Button size="sm" className="bg-amber-500 text-white hover:bg-amber-400 border-0 shrink-0">{t('getStarted')}</Button></Link>
          </div>
        </div>
      </nav>

      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
              {t('pageTitle')}
            </h1>
            <p className="text-zinc-400">
              {t('pageSubtitle')}
            </p>
          </div>
          <SurveyWizard dark />
        </div>
      </section>
    </div>
  );
}
