'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { AppLink } from '@/components/app/app-link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Settings, X, Menu, Lock } from 'lucide-react';
import { OperationsUpgradeModal, OPERATIONS_UPGRADE_TOOLTIP } from '@/components/app/operations-upgrade-modal';
import { GlobalSearch } from '@/components/search/global-search';
import { DarkModeToggle } from '@/components/app/dark-mode-toggle';
import { LanguageSwitcher } from '@/components/app/language-switcher';
import { useLanguage } from '@/contexts/language-context';
import { getAppT } from '@/lib/app-translations';
import type { NavAlertCounts } from '@/actions/nav-alerts';
import { Badge } from '@/components/ui/badge';
import { getNavSectionsForShell } from '@/lib/nav/shellNav';
import type { NavSection, NavItem } from '@/lib/nav/shellNav';

interface MobileSidebarProps {
  logoUrl?: string | null;
  navAlerts?: NavAlertCounts | null;
  shell?: 'owner_operator' | 'franchisee' | 'franchisor';
  franchiseeEnrolled?: boolean;
  proGearEnabled?: boolean;
  operationsLocked?: boolean;
}

/** Flatten section items (from items or groups) for rendering. */
function getSectionItems(section: NavSection): NavItem[] {
  if (section.groups) return section.groups.flatMap((g) => g.items ?? []);
  return section.items ?? [];
}

/** Hero hrefs shown as top links on mobile (dashboard, financial health, KPIs). */
const MOBILE_HERO_HREFS = ['/app/dashboard', '/app/financial-health', '/app/kpis'];

const MOBILE_ALERT_BADGE_CLASS = 'ml-auto text-[10px] min-w-[18px] h-5 px-1.5 justify-center shrink-0 bg-destructive text-destructive-foreground border-0';

function isItemActive(pathname: string, item: NavItem): boolean {
  if (pathname === item.href) return true;
  if (item.href === '/app/dashboard' && pathname === '/app/dashboard') return true;
  if (item.href === '/app/financial-health' && pathname.startsWith('/app/financial-health')) return true;
  if (item.href === '/app/kpis' && (pathname === '/app/kpis' || pathname.startsWith('/app/kpis/'))) return true;
  if (item.href === '/app/sales/launch-packets' && (pathname === '/app/sales/contract-launch' || pathname.startsWith('/app/sales/contract-launch/') || pathname === '/app/sales/launch-packet' || pathname.startsWith('/app/sales/launch-packet/'))) return true;
  if (item.href === '/app/sales/scope' && (pathname === '/app/sales/scope-builder' || pathname.startsWith('/app/sales/scope-builder/'))) return true;
  if (item.href === '/app/crm' && (pathname === '/app/crm' || (pathname.startsWith('/app/crm/') && !pathname.startsWith('/app/crm/pipeline')))) return true;
  if (item.href === '/app/crm/pipeline' && pathname.startsWith('/app/crm/pipeline')) return true;
  if (item.href === '/app/map' && (pathname === '/app/map' || pathname.startsWith('/app/map/'))) return true;
  if (item.href !== '/app/dashboard' && pathname.startsWith(item.href + '/')) return true;
  if (item.href.startsWith('/app/sales/') && (pathname === item.href || pathname.startsWith(item.href + '/'))) return true;
  if (item.href.startsWith('/app/ops/') && (pathname === item.href || pathname.startsWith(item.href + '/'))) return true;
  if (item.href === '/app/admin' && pathname.startsWith('/app/admin')) return true;
  if (item.href === '/app/settings' && pathname.startsWith('/app/settings')) return true;
  return false;
}

export function MobileSidebar({ logoUrl, navAlerts, shell, franchiseeEnrolled, proGearEnabled, operationsLocked }: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const pathname = usePathname();
  const { locale } = useLanguage();
  const t = getAppT(locale);
  const alerts = navAlerts ?? { handoffsCount: 0, openIssuesCount: 0, missedTaskCount: 0 };

  const sections = useMemo(
    () => getNavSectionsForShell(shell ?? 'owner_operator', franchiseeEnrolled ?? false),
    [shell, franchiseeEnrolled]
  );

  const executiveSection = sections.find((s) => s.id === 'executive');
  const heroItems = useMemo(() => {
    if (!executiveSection) return [];
    const items = getSectionItems(executiveSection);
    return MOBILE_HERO_HREFS.map((href) => items.find((i) => i.href === href)).filter(Boolean) as NavItem[];
  }, [executiveSection]);

  const executiveRest = useMemo(() => {
    if (!executiveSection) return [];
    return getSectionItems(executiveSection).filter((i) => !MOBILE_HERO_HREFS.includes(i.href));
  }, [executiveSection]);

  const otherSections = useMemo(() => sections.filter((s) => s.id !== 'executive'), [sections]);

  const getAlertCount = (alertKey?: keyof NavAlertCounts) => {
    if (!alertKey) return 0;
    const n = alerts[alertKey];
    return typeof n === 'number' ? n : 0;
  };

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Header - brand tint */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 border-b border-primary bg-primary text-primary-foreground">
        <div className="flex items-center gap-3 [&>span]:bg-transparent [&>span]:shadow-none [&>span]:block">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(true)}
            className="h-10 w-10 text-primary-foreground hover:bg-primary-foreground/15"
          >
            <Menu className="h-6 w-6" />
          </Button>
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt="Company Logo"
              width={200}
              height={72}
              className="h-14 w-auto max-h-14 object-contain bg-transparent"
              priority
              unoptimized
            />
          ) : (
            <Image
              src="/logo.png"
              alt="JANIBEAR Logo"
              width={220}
              height={72}
              className="h-14 w-auto max-h-14 object-contain bg-transparent [&>img]:bg-transparent dark:[&>img]:drop-shadow-[0_0_8px_rgba(255,255,255,0.15)] dark:[&>img]:brightness-110"
              priority
              unoptimized
            />
          )}
        </div>
        <div className="flex items-center gap-2 [&_button]:text-primary-foreground [&_button]:hover:bg-primary-foreground/15 [&_.rounded-lg]:border-primary-foreground/30">
          <LanguageSwitcher />
          <DarkModeToggle />
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
          <aside className="fixed top-0 left-0 z-50 h-full w-80 bg-primary/15 dark:bg-primary/20 shadow-xl lg:hidden transform transition-transform duration-300 border-r-2 border-primary">
            <div className="flex h-full flex-col">
              <div className="flex min-h-[5rem] items-center justify-between border-b border-primary/30 px-4 py-3 bg-primary/20 dark:bg-primary/25 gap-3">
                <AppLink href="/app/dashboard" className="flex min-h-[4rem] flex-1 min-w-0 items-center bg-transparent [&>span]:bg-transparent [&>span]:shadow-none [&>span]:block [&>span]:!relative [&>span]:h-16 [&>span]:w-full [&>span]:max-w-[200px]">
                  {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt="Company Logo"
                      width={200}
                      height={64}
                      className="h-16 w-full max-h-16 object-contain object-left bg-transparent"
                      priority
                      unoptimized
                    />
                  ) : (
                    <Image
                      src="/logo.png"
                      alt="JANIBEAR Logo"
                      width={200}
                      height={64}
                      className="h-16 w-full max-h-16 object-contain object-left bg-transparent [&>img]:bg-transparent dark:[&>img]:drop-shadow-[0_0_8px_rgba(255,255,255,0.15)] dark:[&>img]:brightness-110"
                      priority
                      unoptimized
                    />
                  )}
                </AppLink>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-12 w-12"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>

              <div className="p-4 border-b dark:border-gray-800 space-y-3">
                <GlobalSearch />
              </div>

              <nav className="flex-1 space-y-4 p-4 overflow-y-auto">
                {/* Hero links: Dashboard, Financial Health, KPIs (from nav factory executive section) */}
                {heroItems.map((item) => {
                  const Icon = item.icon;
                  const active = isItemActive(pathname, item);
                  return (
                    <AppLink
                      key={`${item.href}-${item.labelKey}`}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors min-h-[48px] ${
                        active ? 'bg-primary text-primary-foreground' : 'text-foreground/90 hover:bg-foreground/10 dark:text-foreground/95 dark:hover:bg-foreground/10'
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {t(item.labelKey)}
                    </AppLink>
                  );
                })}

                {/* Rest of Executive section (Alerts, Map, Benchmarks, HelpHub) */}
                {executiveRest.length > 0 && (
                  <div className="space-y-1">
                    <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-foreground/75 dark:text-foreground/80">
                      {t('navExecutive')}
                    </p>
                    {executiveRest.map((item) => {
                      const Icon = item.icon;
                      const active = isItemActive(pathname, item);
                      return (
                        <AppLink
                          key={`${item.href}-${item.labelKey}`}
                          href={item.href}
                          className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors min-h-[44px] ${
                            active ? 'bg-primary text-primary-foreground' : 'text-foreground/90 hover:bg-foreground/10 dark:text-foreground/95 dark:hover:bg-foreground/10'
                          }`}
                        >
                          <Icon className="h-5 w-5 shrink-0" />
                          {t(item.labelKey)}
                        </AppLink>
                      );
                    })}
                  </div>
                )}

                {/* Sales, Launch, Operations, System (from nav factory) */}
                {otherSections.map((section) => {
                  const items = getSectionItems(section);
                  if (items.length === 0) return null;
                  const isOperationsLocked = section.id === 'operations' && operationsLocked;
                  return (
                    <div key={section.id} className={`space-y-1 ${isOperationsLocked ? 'opacity-70' : ''} ${section.id !== 'franchisor' ? '' : ''}`}>
                      <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-foreground/75 dark:text-foreground/80 flex items-center gap-1.5">
                        {t(section.labelKey)}
                        {isOperationsLocked && <Lock className="h-3.5 w-3.5" />}
                      </p>
                      {items.map((item) => {
                        const Icon = item.icon;
                        const active = isItemActive(pathname, item);
                        const alertCount = getAlertCount(item.alertKey);
                        if (isOperationsLocked) {
                          return (
                            <button
                              key={`${item.href}-${item.labelKey}`}
                              type="button"
                              title={OPERATIONS_UPGRADE_TOOLTIP}
                              onClick={() => setUpgradeModalOpen(true)}
                              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors min-h-[44px] text-foreground/80 hover:bg-foreground/10 dark:text-foreground/85 dark:hover:bg-foreground/10"
                            >
                              <Icon className="h-5 w-5 shrink-0" />
                              {t(item.labelKey)}
                              <Lock className="h-4 w-4 shrink-0 ml-auto opacity-60" />
                            </button>
                          );
                        }
                        return (
                          <AppLink
                            key={`${item.href}-${item.labelKey}`}
                            href={item.href}
                            className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors min-h-[44px] ${
                              active ? 'bg-primary text-primary-foreground' : 'text-foreground/90 hover:bg-foreground/10 dark:text-foreground/95 dark:hover:bg-foreground/10'
                            }`}
                          >
                            <Icon className="h-5 w-5 shrink-0" />
                            {t(item.labelKey)}
                            {alertCount > 0 && (
                              <Badge variant="destructive" className={MOBILE_ALERT_BADGE_CLASS}>
                                {alertCount > 99 ? '99+' : alertCount}
                              </Badge>
                            )}
                          </AppLink>
                        );
                      })}
                    </div>
                  );
                })}

                <div className="pt-2 border-t dark:border-gray-800">
                  <AppLink
                    href="/app/settings"
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors min-h-[44px] ${
                      pathname.startsWith('/app/settings')
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground/90 hover:bg-foreground/10 dark:text-foreground/95 dark:hover:bg-foreground/10'
                    }`}
                  >
                    <Settings className="h-5 w-5 shrink-0" />
                    {t('navSettings')}
                  </AppLink>
                </div>
              </nav>

              <div className="border-t dark:border-gray-800 p-4">
                <Button asChild variant="outline" className="w-full h-12 text-base">
                  <a href="/auth/logout">{t('signOut')}</a>
                </Button>
              </div>
            </div>
          </aside>
        </>
      )}
      <OperationsUpgradeModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} />
    </>
  );
}
