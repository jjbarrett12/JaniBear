'use client';

import { useState, useEffect, useMemo } from 'react';
import { AppLink } from '@/components/app/app-link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/language-context';
import { getAppT } from '@/lib/app-translations';
import { Badge } from '@/components/ui/badge';
import type { NavAlertCounts } from '@/actions/nav-alerts';
import type { AppTranslationKey } from '@/lib/app-translations';
import type { ShellKey } from '@/lib/shell';
import { getNavSectionsForShell } from '@/lib/nav/shellNav';
import type { NavSection, NavItem } from '@/lib/nav/shellNav';
import {
  ChevronDown,
  ChevronRight,
  Settings,
} from 'lucide-react';

const STORAGE_KEY = 'janibear-nav-collapsed';

function getSectionIdForPath(sections: NavSection[], pathname: string): string {
  if (pathname === '/app/kpis' || pathname.startsWith('/app/kpis/')) {
    const exec = sections.find((s) => s.id === 'executive');
    if (exec) return 'executive';
  }
  if (pathname === '/app/benchmarks' || pathname.startsWith('/app/benchmarks/')) {
    const exec = sections.find((s) => s.id === 'executive');
    if (exec) return 'executive';
  }
  if (pathname === '/app/alerts' || pathname.startsWith('/app/alerts/')) {
    const exec = sections.find((s) => s.id === 'executive');
    if (exec) return 'executive';
  }
  for (const section of sections) {
    for (const item of section.items) {
      if (pathname === item.href) return section.id;
      if (item.href !== '/app/dashboard' && pathname.startsWith(item.href + '/')) return section.id;
      if (item.href === '/app/crm' && (pathname === '/app/crm' || pathname.startsWith('/app/crm/'))) return section.id;
      if (pathname.startsWith('/app/sales/') || pathname === '/app/sales') return section.id;
      if (pathname.startsWith('/app/ops/')) return section.id;
    }
  }
  return sections[0]?.id ?? 'executive';
}

function navLinkClass(active: boolean) {
  return `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors min-h-[40px] border-l-2 ${
    active
      ? 'border-l-primary bg-primary/10 text-foreground font-medium'
      : 'border-l-transparent text-muted-foreground hover:bg-muted/70 hover:text-foreground'
  }`;
}

const ALERT_BADGE_CLASS =
  'ml-auto text-[10px] min-w-[18px] h-5 px-1.5 justify-center shrink-0 bg-destructive text-destructive-foreground border-0 rounded-md';

/** Section header: subtle tint by section, readable in light/dark. */
function sectionHeaderColor(sectionId: string, isActive: boolean): string {
  const base = 'rounded-lg transition-colors duration-150 ';
  if (isActive) {
    const active: Record<string, string> = {
      executive: 'bg-sky-500/12 text-sky-800 dark:bg-sky-400/15 dark:text-sky-200',
      sales: 'bg-amber-500/12 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200',
      growth: 'bg-amber-500/12 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200',
      operations: 'bg-emerald-500/12 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200',
      system: 'bg-slate-500/12 text-slate-800 dark:bg-slate-400/15 dark:text-slate-200',
      franchisor: 'bg-sky-500/12 text-sky-800 dark:bg-sky-400/15 dark:text-sky-200',
    };
    return base + (active[sectionId] ?? 'bg-muted text-foreground');
  }
  const inactive: Record<string, string> = {
    executive: 'text-sky-700 dark:text-sky-300/90 hover:bg-sky-500/8',
    sales: 'text-amber-700 dark:text-amber-300/90 hover:bg-amber-500/8',
    growth: 'text-amber-700 dark:text-amber-300/90 hover:bg-amber-500/8',
    operations: 'text-emerald-700 dark:text-emerald-300/90 hover:bg-emerald-500/8',
    system: 'text-slate-600 dark:text-slate-400 hover:bg-slate-500/8',
    franchisor: 'text-sky-700 dark:text-sky-300/90 hover:bg-sky-500/8',
  };
  return base + (inactive[sectionId] ?? 'text-muted-foreground hover:bg-muted/60');
}

export function AppSidebarNav({
  premium,
  navAlerts,
  shell = 'owner_operator',
  franchiseeEnrolled = false,
}: {
  premium: boolean;
  navAlerts?: NavAlertCounts | null;
  shell?: ShellKey;
  franchiseeEnrolled?: boolean;
}) {
  const pathname = usePathname();
  const { locale } = useLanguage();
  const t = getAppT(locale);
  const alerts = navAlerts ?? { handoffsCount: 0, openIssuesCount: 0, missedTaskCount: 0 };

  const sections = useMemo(
    () => getNavSectionsForShell(shell, franchiseeEnrolled),
    [shell, franchiseeEnrolled]
  );
  const activeSectionId = getSectionIdForPath(sections, pathname);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCollapsed(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    setCollapsed((prev) => {
      const next = { ...prev };
      sections.forEach((s) => {
        if (s.id === activeSectionId && next[s.id] !== false) next[s.id] = false;
      });
      return next;
    });
  }, [activeSectionId, sections]);

  const toggle = (id: string) => {
    setCollapsed((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const isItemActive = (item: NavItem) => {
    if (pathname === item.href) return true;
    if (item.href === '/app/kpis' && (pathname === '/app/kpis' || pathname.startsWith('/app/kpis/'))) return true;
    if (item.href === '/app/crm/pipeline' && pathname.startsWith('/app/crm/pipeline')) return true;
    if (item.href === '/app/crm' && (pathname === '/app/crm' || (pathname.startsWith('/app/crm/') && !pathname.startsWith('/app/crm/pipeline')))) return true;
    if (item.href === '/app/ops/map' && pathname.startsWith('/app/ops/map')) return true;
    if (item.href === '/app/ops/accounts' && pathname.startsWith('/app/ops/accounts')) return true;
    if (item.href === '/app/accounts' && pathname.startsWith('/app/accounts')) return true;
    if (item.href.startsWith('/app/sales/') && (pathname === item.href || pathname.startsWith(item.href + '/'))) return true;
    if (item.href.startsWith('/app/ops/') && (pathname === item.href || pathname.startsWith(item.href + '/'))) return true;
    if (item.href === '/app/franchise' && (pathname === '/app/franchise' || pathname.startsWith('/app/franchise/'))) return true;
    if (item.href === '/app/opportunities/network' && pathname.startsWith('/app/opportunities/network')) return true;
    if (item.href !== '/app/dashboard' && pathname.startsWith(item.href + '/')) return true;
    return false;
  };

  const getAlertCount = (alertKey?: keyof NavAlertCounts) => {
    if (!alertKey) return 0;
    const n = alerts[alertKey];
    return typeof n === 'number' ? n : 0;
  };

  return (
    <nav className="min-w-0 flex-1 overflow-y-auto px-3 py-4">
      <div className="space-y-5">
        {sections.map((section) => {
          const isOpen = collapsed[section.id] !== true;
          const isActiveSection = section.id === activeSectionId;

          return (
            <div key={section.id} className="space-y-1">
              <button
                type="button"
                onClick={() => toggle(section.id)}
                className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-widest transition-colors min-h-[40px] ${sectionHeaderColor(section.id, isActiveSection)}`}
                aria-expanded={isOpen}
              >
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                )}
                <span className="truncate">{t(section.labelKey)}</span>
              </button>

              {isOpen && (
                <div className="space-y-0.5 pl-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = isItemActive(item);
                    const alertCount = getAlertCount(item.alertKey);
                    return (
                      <AppLink
                        key={`${item.href}-${item.labelKey}`}
                        href={item.href}
                        className={navLinkClass(active)}
                      >
                        <Icon
                          className={`h-5 w-5 shrink-0 ${active ? 'opacity-100' : 'opacity-70'}`}
                          aria-hidden
                        />
                        <span className="truncate">{t(item.labelKey)}</span>
                        {alertCount > 0 && (
                          <Badge variant="destructive" className={ALERT_BADGE_CLASS} title="Requires attention">
                            {alertCount > 99 ? '99+' : alertCount}
                          </Badge>
                        )}
                      </AppLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-border/80">
        <AppLink href="/app/settings" className={navLinkClass(pathname.startsWith('/app/settings'))}>
          <Settings className="h-5 w-5 shrink-0 opacity-70" aria-hidden />
          <span className="truncate">{t('navSettings')}</span>
        </AppLink>
      </div>
    </nav>
  );
}
