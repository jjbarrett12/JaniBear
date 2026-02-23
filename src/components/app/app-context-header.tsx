'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AppLink } from '@/components/app/app-link';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { DarkModeToggle } from '@/components/app/dark-mode-toggle';
import { LanguageSwitcher } from '@/components/app/language-switcher';
import { AlertTriangle, ChevronDown, Rocket, AlertCircle, Calendar } from 'lucide-react';
import type { NavAlertCounts } from '@/actions/nav-alerts';
import { getAppT } from '@/lib/app-translations';
import { useLanguage } from '@/contexts/language-context';

export function AppContextHeader({
  orgName,
  navAlerts,
}: {
  orgName: string | null;
  navAlerts?: NavAlertCounts | null;
}) {
  const [riskDrawerOpen, setRiskDrawerOpen] = useState(false);
  const { locale } = useLanguage();
  const t = getAppT(locale);
  const alerts = navAlerts ?? { handoffsCount: 0, openIssuesCount: 0, missedTaskCount: 0 };
  const total = alerts.handoffsCount + alerts.openIssuesCount + alerts.missedTaskCount;

  return (
    <>
      <header className="sticky top-0 z-30 shrink-0 border-b-2 border-b-primary/30 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="flex h-14 items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="truncate text-sm font-semibold text-foreground">
              {orgName || 'JANIBEAR'}
            </span>
            <span className="hidden text-muted-foreground md:inline">/</span>
            <span className="hidden truncate text-xs text-muted-foreground md:inline">
              Active
            </span>
          </div>

          <div className="flex items-center gap-2">
            {total > 0 && (
              <button
                type="button"
                onClick={() => setRiskDrawerOpen(true)}
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors"
                title={t('itemsRequireAttention').replace('{{count}}', String(total))}
              >
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{total} need attention</span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0" />
              </button>
            )}
            <div className="hidden sm:flex items-center gap-1">
              <LanguageSwitcher />
              <DarkModeToggle />
            </div>
            <NotificationBell />
            <AppLink
              href="/app/settings"
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              title="Settings"
            >
              <span className="text-xs font-medium">Me</span>
            </AppLink>
          </div>
        </div>

        {/* Status bar: items require attention */}
        {total > 0 && (
          <button
            type="button"
            onClick={() => setRiskDrawerOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-t border-amber-200/50 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
          >
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            {t('itemsRequireAttention').replace('{{count}}', String(total))}
          </button>
        )}
      </header>

      {/* Risk drawer */}
      {riskDrawerOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setRiskDrawerOpen(false)} aria-hidden />
          <aside className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-card border-l border-border shadow-xl flex flex-col">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="text-lg font-semibold">Items requiring attention</h2>
              <button
                type="button"
                onClick={() => setRiskDrawerOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {alerts.handoffsCount > 0 && (
                <Link
                  href="/app/ops/launches"
                  onClick={() => setRiskDrawerOpen(false)}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted transition-colors"
                >
                  <Rocket className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">New hand-offs from sales</p>
                    <p className="text-xs text-muted-foreground">{alerts.handoffsCount} launch plan(s) awaiting ops</p>
                  </div>
                </Link>
              )}
              {alerts.openIssuesCount > 0 && (
                <Link
                  href="/app/issues"
                  onClick={() => setRiskDrawerOpen(false)}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted transition-colors"
                >
                  <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">Open issues</p>
                    <p className="text-xs text-muted-foreground">{alerts.openIssuesCount} issue(s) need resolution</p>
                  </div>
                </Link>
              )}
              {alerts.missedTaskCount > 0 && (
                <Link
                  href="/app/schedules"
                  onClick={() => setRiskDrawerOpen(false)}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted transition-colors"
                >
                  <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">Tasks not checked off</p>
                    <p className="text-xs text-muted-foreground">{alerts.missedTaskCount} past-due task(s) — possible no-show or missed clean</p>
                  </div>
                </Link>
              )}
            </div>
          </aside>
        </>
      )}
    </>
  );
}
