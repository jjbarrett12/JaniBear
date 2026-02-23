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
import type { PlanType } from '@/lib/is-premium';
import { getNavSectionsForShell } from '@/lib/nav/shellNav';
import type { NavSection, NavItem } from '@/lib/nav/shellNav';
import {
  ChevronDown,
  ChevronRight,
  Settings,
} from 'lucide-react';

const STORAGE_KEY = 'janibear-nav-collapsed';

function getSectionIdForPath(sections: NavSection[], pathname: string): string {
  if (pathname === '/app/kpis' || pathname.startsWith('/app/kpis/') || pathname === '/app/kpi' || pathname.startsWith('/app/kpi/')) {
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
  const flatItems = (s: NavSection) =>
    s.groups ? s.groups.flatMap((g) => g.items) : (s.items ?? []);
  for (const section of sections) {
    for (const item of flatItems(section)) {
      if (pathname === item.href) return section.id;
      if (item.href !== '/app/dashboard' && pathname.startsWith(item.href + '/')) return section.id;
      if (item.href === '/app/sales/launch-packets' && (pathname === '/app/sales/contract-launch' || pathname.startsWith('/app/sales/contract-launch/') || pathname === '/app/sales/launch-packet' || pathname.startsWith('/app/sales/launch-packet/'))) return section.id;
      if (item.href === '/app/sales/scope' && (pathname === '/app/sales/scope-builder' || pathname.startsWith('/app/sales/scope-builder/'))) return section.id;
      if (item.href === '/app/crm' && (pathname === '/app/crm' || pathname.startsWith('/app/crm/'))) return section.id;
      if (pathname.startsWith('/app/sales/') || pathname === '/app/sales') return section.id;
      if (pathname.startsWith('/app/ops/')) return section.id;
    }
  }
  if (pathname.startsWith('/app/sales/') || pathname === '/app/sales') {
    const sales = sections.find((s) => s.id === 'sales');
    if (sales) return sales.id;
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

/** Section header: uses brand primary so company colors apply. */
function sectionHeaderColor(_sectionId: string, isActive: boolean): string {
  const base = 'rounded-lg transition-colors duration-150 ';
  if (isActive) {
    return base + 'bg-primary/12 text-primary font-semibold dark:bg-primary/20 dark:text-primary';
  }
  return base + 'text-muted-foreground hover:bg-primary/8 hover:text-primary';
}

export function AppSidebarNav({
  premium,
  navAlerts,
  shell = 'owner_operator',
  franchiseeEnrolled = false,
  proGearEnabled = false,
  operationsLocked = false,
}: {
  premium: boolean;
  navAlerts?: NavAlertCounts | null;
  shell?: ShellKey;
  franchiseeEnrolled?: boolean;
  proGearEnabled?: boolean;
  operationsLocked?: boolean;
}) {
  const pathname = usePathname();
  const { locale } = useLanguage();
  const t = getAppT(locale);
  const alerts = navAlerts ?? { handoffsCount: 0, openIssuesCount: 0, missedTaskCount: 0 };
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const sections = useMemo(() => {
    const raw = getNavSectionsForShell(shell, franchiseeEnrolled);
    let result = raw.map((s) => {
      if (s.groups) {
        return {
          ...s,
          groups: s.groups.map((g) => {
            let items = g.items ?? [];
            if (!proGearEnabled) items = items.filter((item) => item.href !== '/app/pro-gear');
            if (s.id === 'sales' && g.labelKey === 'navDecision' && planType === 'cub') {
              items = items.filter((item) => item.href !== '/app/sales/launch-packets');
            }
            return { ...g, items };
          }),
        };
      }
      return {
        ...s,
        items: (s.items ?? []).filter((item) => (proGearEnabled || item.href !== '/app/pro-gear')),
      };
    });
    return result;
  }, [shell, franchiseeEnrolled, proGearEnabled, planType]);
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
    if (item.href === '/app/sales/launch-packets' && (pathname === '/app/sales/contract-launch' || pathname.startsWith('/app/sales/contract-launch/') || pathname === '/app/sales/launch-packet' || pathname.startsWith('/app/sales/launch-packet/'))) return true;
    if (item.href === '/app/sales/scope' && (pathname === '/app/sales/scope-builder' || pathname.startsWith('/app/sales/scope-builder/'))) return true;
    if (item.href === '/app/kpis' && (pathname === '/app/kpis' || pathname.startsWith('/app/kpis/'))) return true;
    if (item.href === '/app/kpi' && (pathname === '/app/kpi' || pathname.startsWith('/app/kpi/'))) return true;
    if (item.href === '/app/crm/pipeline' && pathname.startsWith('/app/crm/pipeline')) return true;
    if (item.href === '/app/crm' && (pathname === '/app/crm' || (pathname.startsWith('/app/crm/') && !pathname.startsWith('/app/crm/pipeline')))) return true;
    if (item.href === '/app/ops/map' && pathname.startsWith('/app/ops/map')) return true;
    if (item.href === '/app/ops/accounts' && pathname.startsWith('/app/ops/accounts')) return true;
    if (item.href === '/app/accounts' && pathname.startsWith('/app/accounts')) return true;
    if (item.href === '/app/sales/accounts' && (pathname === '/app/sales/accounts' || pathname.startsWith('/app/sales/accounts/'))) return true;
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
          const isOperationsLocked = section.id === 'operations' && operationsLocked;

          return (
            <div key={section.id} className={`space-y-1 ${isOperationsLocked ? 'opacity-70' : ''}`}>
              <button
                type="button"
                onClick={() => toggle(section.id)}
                className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-widest transition-colors min-h-[40px] ${sectionHeaderColor(section.id, isActiveSection)}`}
                aria-expanded={isOpen}
                title={isOperationsLocked ? OPERATIONS_UPGRADE_TOOLTIP : undefined}
              >
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                )}
                <span className="truncate">{t(section.labelKey)}</span>
                {isOperationsLocked && <Lock className="h-3.5 w-3.5 shrink-0 ml-auto" aria-hidden />}
              </button>

              {isOpen && (
                <div className="space-y-0.5 pl-1">
                  {section.groups ? (
                    section.groups.map((group, groupIndex) => {
                      const groupItems = group.items ?? [];
                      const hasActiveInGroup = groupItems.some((item) => isItemActive(item));
                      const isLaunchToOps = (item: NavItem) =>
                        item.href === '/app/sales/launch-packets' || item.labelKey === 'navLaunchToOperations';
                      return (
                        <div
                          key={group.labelKey}
                          className={`space-y-0.5 ${groupIndex > 0 ? 'mt-5' : ''}`}
                        >
                          <p
                            className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80 border-l-2 ${
                              hasActiveInGroup && section.id === 'sales'
                                ? 'border-l-primary/50'
                                : 'border-l-transparent'
                            }`}
                          >
                            {t(group.labelKey)}
                          </p>
                          {(groupItems).map((item) => {
                            const Icon = item.icon;
                            const active = isItemActive(item);
                            const alertCount = getAlertCount(item.alertKey);
                            const isLaunch = isLaunchToOps(item);
                            const linkClass = isLaunch && active
                              ? 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors min-h-[40px] border-l-2 border-l-primary bg-primary/15 text-foreground font-medium ring-1 ring-primary/20'
                              : navLinkClass(active);
                            return (
                              <AppLink
                                key={`${item.href}-${item.labelKey}`}
                                href={item.href}
                                className={linkClass}
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
                      );
                    })
                  ) : (
                    (section.items ?? []).map((item) => {
                      const Icon = item.icon;
                      const active = isItemActive(item);
                      const alertCount = getAlertCount(item.alertKey);
                      if (isOperationsLocked) {
                        return (
                          <button
                            key={`${item.href}-${item.labelKey}`}
                            type="button"
                            title={OPERATIONS_UPGRADE_TOOLTIP}
                            onClick={() => setUpgradeModalOpen(true)}
                            className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors min-h-[40px] border-l-2 border-l-transparent text-muted-foreground hover:bg-muted/70 hover:text-foreground`}
                          >
                            <Icon className="h-5 w-5 shrink-0 opacity-70" aria-hidden />
                            <span className="truncate">{t(item.labelKey)}</span>
                            <Lock className="h-3.5 w-3.5 shrink-0 ml-auto opacity-60" aria-hidden />
                          </button>
                        );
                      }
                      const linkClass = navLinkClass(active);
                      return (
                        <AppLink
                          key={`${item.href}-${item.labelKey}`}
                          href={item.href}
                          className={linkClass}
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
                    })
                  )}
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

      <OperationsUpgradeModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} />
    </nav>
  );
}
