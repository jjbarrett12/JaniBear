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
import type { NavSection } from '@/lib/nav/shellNav';
import {
  ChevronDown,
  ChevronRight,
  Settings,
} from 'lucide-react';

const STORAGE_KEY = 'janibear-nav-collapsed';

function getSectionIdForPath(sections: NavSection[], pathname: string): string {
  for (const section of sections) {
    for (const item of section.items) {
      if (pathname === item.href) return section.id;
      if (item.href !== '/app/dashboard' && pathname.startsWith(item.href + '/')) return section.id;
      if (item.href === '/app/crm' && (pathname === '/app/crm' || pathname.startsWith('/app/crm/'))) return section.id;
      if (item.href === '/app/sales' && (pathname === '/app/sales' || pathname.startsWith('/app/sales/'))) return section.id;
    }
  }
  return sections[0]?.id ?? 'executive';
}

function navLinkClass(active: boolean) {
  return `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors min-h-[36px] ${
    active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
  }`;
}

const ALERT_BADGE_CLASS = 'ml-auto text-[10px] min-w-[18px] h-5 px-1.5 justify-center shrink-0 bg-destructive text-destructive-foreground border-0';

function sectionHeaderColor(sectionId: string, isActive: boolean): string {
  const base = 'hover:opacity-90 ';
  if (isActive) {
    const active: Record<string, string> = {
      executive: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
      growth: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
      operations: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
      system: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
      franchisor: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
    };
    return base + (active[sectionId] ?? 'bg-muted text-foreground');
  }
  const inactive: Record<string, string> = {
    executive: 'text-blue-600 dark:text-blue-400',
    growth: 'text-amber-600 dark:text-amber-400',
    operations: 'text-emerald-600 dark:text-emerald-400',
    system: 'text-violet-600 dark:text-violet-400',
    franchisor: 'text-blue-600 dark:text-blue-400',
  };
  return base + (inactive[sectionId] ?? 'text-muted-foreground hover:bg-muted/60 hover:text-foreground');
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
    if (item.href === '/app/crm/pipeline' && pathname.startsWith('/app/crm/pipeline')) return true;
    if (item.href === '/app/crm' && (pathname === '/app/crm' || (pathname.startsWith('/app/crm/') && !pathname.startsWith('/app/crm/pipeline')))) return true;
    if (item.href === '/app/sites' && pathname.startsWith('/app/sites')) return true;
    if (item.href === '/app/map' && pathname.startsWith('/app/map')) return true;
    if (item.href === '/app/accounts' && pathname.startsWith('/app/accounts')) return true;
    if (item.href === '/app/sales' && (pathname === '/app/sales' || pathname.startsWith('/app/sales/'))) return true;
    if (item.href === '/app/ops/launches' && pathname.startsWith('/app/ops/launches')) return true;
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
    <nav className="min-w-0 flex-1 space-y-0.5 overflow-y-auto p-2">
      {sections.map((section) => {
        const isOpen = collapsed[section.id] !== true;
        const isActiveSection = section.id === activeSectionId;

        return (
          <div key={section.id} className="space-y-0.5">
            <button
              type="button"
              onClick={() => toggle(section.id)}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider transition-colors min-h-[36px] ${sectionHeaderColor(section.id, isActiveSection)}`}
            >
              {isOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
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
                      <Icon className="h-5 w-5 shrink-0" />
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

      <div className="pt-1.5 mt-1 border-t border-border space-y-0.5">
        <AppLink href="/app/settings" className={navLinkClass(pathname.startsWith('/app/settings'))}>
          <Settings className="h-5 w-5 shrink-0" />
          <span className="truncate">{t('navSettings')}</span>
        </AppLink>
      </div>
    </nav>
  );
}
